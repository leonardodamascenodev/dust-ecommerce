const products = {
  oriente: { name: 'Camiseta Oriente Azul', price: 169.90, oldPrice: 199.90, image: 'img/imagem-produto1.avif', second: 'img/oriente_2.jpg', color: 'Azul' },
  better: { name: 'Camiseta Better World Verde', price: 119.90, oldPrice: 149.90, image: 'img/1-better-world-verde.avif', color: 'Verde' },
  fake: { name: 'Camiseta Fake Perceptions', price: 119.90, oldPrice: 149.90, image: 'img/camiseta-fake-perceptions.avif', color: 'Preto' },
  signature: { name: 'Camiseta Signature Preta - The Dust', price: 119.90, oldPrice: 149.90, image: 'img/camiseta-thedust.avif', color: 'Preto' },
  all: { name: 'Camiseta All Dust', price: 119.90, oldPrice: 149.90, image: 'img/camiseta-all-dust.avif', color: 'Preto', soldOut: true },
  rituals: { name: 'Camiseta Rituals', price: 119.90, oldPrice: 149.90, image: 'img/camiseta-rituals.avif', color: 'Preto' }
};

const CART_KEY = 'dust-cart-v2';
const COUPON_KEY = 'dust-coupon-v2';
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY));
    if (Array.isArray(stored)) return stored.filter(item => products[item.id] && !products[item.id].soldOut && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch (_) { /* Se o armazenamento estiver indisponível, use os itens demonstrativos. */ }
  return [
    { id: 'oriente', size: 'M', quantity: 1 },
    { id: 'better', size: 'M', quantity: 1 },
    { id: 'fake', size: 'M', quantity: 1 }
  ];
}

function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) { /* A navegação continua funcionando sem persistência. */ }
  updateCartCount(cart);
}

function updateCartCount(cart = readCart()) {
  const count = document.getElementById('cart-count');
  if (count) count.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function addToCart(id, size = 'M') {
  if (!products[id] || products[id].soldOut) return;
  const cart = readCart();
  const existing = cart.find(item => item.id === id && item.size === size);
  if (existing) existing.quantity += 1;
  else cart.push({ id, size, quantity: 1 });
  saveCart(cart);
  window.location.href = 'carrinho.html';
}

function initHome() {
  document.querySelectorAll('.add-product').forEach(button => {
    button.addEventListener('click', () => addToCart(button.dataset.product));
  });
  const newsletter = document.getElementById('newsletter-form');
  newsletter?.addEventListener('submit', event => {
    event.preventDefault();
    document.getElementById('newsletter-message').textContent = 'E-mail preenchido. Cadastro de novidades disponível em breve.';
    newsletter.reset();
  });
}

function initProduct() {
  const id = new URLSearchParams(window.location.search).get('id') || 'oriente';
  const product = products[id] || products.oriente;
  document.title = `${product.name} | Dust`;
  document.getElementById('breadcrumb-product').textContent = product.name;
  document.getElementById('product-title').textContent = product.name;
  document.getElementById('old-price').textContent = money(product.oldPrice);
  document.getElementById('current-price').textContent = money(product.price);
  document.getElementById('spec-color').textContent = product.color;
  const main = document.getElementById('gallery-main');
  main.src = product.image;
  main.alt = `${product.name}, vista principal`;
  const imageSources = [product.image, product.second || product.image, product.image, product.second || product.image];
  const imageDescriptions = ['Vista principal', 'Vista alternativa', 'Detalhe superior', 'Detalhe inferior'];
  const thumbs = document.getElementById('gallery-thumbs');
  thumbs.replaceChildren();
  imageSources.forEach((source, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Ver imagem ${index + 1}: ${imageDescriptions[index]}`);
    if (index === 0) button.classList.add('active');
    const image = document.createElement('img');
    image.src = source;
    image.alt = imageDescriptions[index];
    if (index === 2) image.style.objectPosition = 'center 10%';
    if (index === 3) image.style.objectPosition = 'center 80%';
    button.append(image);
    button.addEventListener('click', () => {
      main.src = source;
      main.alt = `${product.name}, ${imageDescriptions[index].toLowerCase()}`;
      main.style.objectPosition = index === 2 ? 'center 10%' : index === 3 ? 'center 80%' : 'center 28%';
      thumbs.querySelectorAll('button').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
    });
    thumbs.append(button);
  });
  const add = document.getElementById('product-add');
  if (product.soldOut) {
    add.textContent = 'Indisponível';
    add.setAttribute('aria-disabled', 'true');
    add.classList.add('disabled');
  }
  add.addEventListener('click', event => {
    event.preventDefault();
    if (product.soldOut) return;
    const size = document.getElementById('product-size');
    const error = document.getElementById('size-error');
    if (!size.value) { error.textContent = 'Escolha um tamanho para continuar.'; size.focus(); return; }
    error.textContent = '';
    addToCart(id, size.value);
  });
}

function totals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + products[item.id].price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 299 ? 0 : 19.90;
  const coupon = (() => { try { return localStorage.getItem(COUPON_KEY) === 'DUST10'; } catch (_) { return false; } })();
  const discount = coupon ? subtotal * .1 : 0;
  return { subtotal, shipping, discount, total: subtotal + shipping - discount };
}

function initCart() {
  const body = document.getElementById('cart-body');
  const checkout = document.querySelector('.btn-checkout');
  function render() {
    const cart = readCart();
    body.replaceChildren();
    cart.forEach((item, index) => {
      const product = products[item.id];
      const row = document.createElement('tr');
      const productCell = document.createElement('td');
      const productWrap = document.createElement('div');
      productWrap.className = 'cart-product';
      const image = document.createElement('img');
      image.src = product.image;
      image.alt = '';
      const name = document.createElement('span');
      name.textContent = product.name;
      const category = document.createElement('small');
      category.textContent = `Camiseta · Tamanho ${item.size}`;
      name.append(category);
      productWrap.append(image, name);
      productCell.append(productWrap);
      const price = document.createElement('td'); price.textContent = money(product.price);
      const quantityCell = document.createElement('td');
      const quantity = document.createElement('input');
      quantity.type = 'number'; quantity.min = '1'; quantity.value = String(item.quantity);
      quantity.setAttribute('aria-label', `Quantidade da ${product.name}`);
      quantity.addEventListener('change', () => {
        const next = Math.max(1, Math.floor(Number(quantity.value) || 1));
        cart[index].quantity = next;
        saveCart(cart); render();
      });
      quantityCell.append(quantity);
      const subtotal = document.createElement('td'); subtotal.textContent = money(product.price * item.quantity);
      const action = document.createElement('td');
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'remove-button'; remove.textContent = '🗑️';
      remove.setAttribute('aria-label', `Remover ${product.name}`);
      remove.addEventListener('click', () => { cart.splice(index, 1); saveCart(cart); render(); });
      action.append(remove);
      row.append(productCell, price, quantityCell, subtotal, action);
      body.append(row);
    });
    if (!cart.length) {
      const row = document.createElement('tr'); const cell = document.createElement('td');
      cell.colSpan = 5; cell.className = 'empty-cart'; cell.textContent = 'Seu carrinho está vazio. Escolha uma camiseta na vitrine.';
      row.append(cell); body.append(row);
    }
    const sum = totals(cart);
    document.getElementById('cart-subtotal').textContent = money(sum.subtotal);
    document.getElementById('cart-shipping').textContent = sum.shipping ? money(sum.shipping) : 'Grátis';
    document.getElementById('cart-total').textContent = money(sum.total);
    checkout.setAttribute('aria-disabled', String(cart.length === 0));
    updateCartCount(cart);
  }
  document.getElementById('coupon-form').addEventListener('submit', event => {
    event.preventDefault();
    const code = document.getElementById('coupon-code').value.trim().toUpperCase();
    const message = document.getElementById('coupon-message');
    if (code === 'DUST10') {
      try { localStorage.setItem(COUPON_KEY, code); } catch (_) { /* Sem persistência. */ }
      message.textContent = 'Cupom DUST10 aplicado: 10% de desconto.';
    } else {
      try { localStorage.removeItem(COUPON_KEY); } catch (_) { /* Sem persistência. */ }
      message.textContent = 'Cupom inválido. Experimente DUST10.';
    }
    render();
  });
  render();
}

function initCheckout() {
  const cart = readCart();
  const sum = totals(cart);
  document.getElementById('checkout-items').textContent = cart.length ? `${cart.reduce((count, item) => count + item.quantity, 0)} item(ns) no carrinho.` : 'Seu carrinho está vazio.';
  document.getElementById('checkout-subtotal').textContent = money(sum.subtotal);
  document.getElementById('checkout-shipping').textContent = sum.shipping ? money(sum.shipping) : 'Grátis';
  document.getElementById('checkout-total').textContent = money(sum.total);
  document.getElementById('checkout-form').addEventListener('submit', event => {
    event.preventDefault();
    document.getElementById('checkout-message').textContent = 'Dados validados! Este checkout é uma demonstração da atividade; nenhum pagamento foi processado.';
  });
}

updateCartCount();
const page = document.body.dataset.page;
if (page === 'home') initHome();
if (page === 'product') initProduct();
if (page === 'cart') initCart();
if (page === 'checkout') initCheckout();
