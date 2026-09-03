const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const KEY = 'apkaMerchantStoreV1';

let s = JSON.parse(localStorage.getItem(KEY) || '{"categories":[],"products":[]}');
let imgs = [];

const save = () => localStorage.setItem(KEY, JSON.stringify(s));
const esc = (value) => {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
};

function show(id) {
  $$('.page').forEach((page) => page.classList.add('hide'));
  const target = $('#' + id);
  if (target) {
    target.classList.remove('hide');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeAddProductWindow() {
  const inventory = $('#inventory');
  if (!inventory) return;
  inventory.classList.remove('is-modal');
  document.body.classList.remove('modal-open');
  if (s.business) {
    dash();
  } else {
    show('business');
  }
}

function openAddProductWindow() {
  const inventory = $('#inventory');
  if (!inventory) return;
  show('inventory');
  inventory.classList.add('is-modal');
  document.body.classList.add('modal-open');
  renderCats();
  window.setTimeout(() => {
    $('#productForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 60);
}

const reserved = ['apka', 'admin', 'support', 'demo', 'fashionhub', 'sharma-fashion'];

function check() {
  const value = $('#domain').value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  $('#domain').value = value;
  const storeLink = (value || '—') + '.apka.store';
  $('#url').textContent = storeLink;
  $('#successUrl').textContent = storeLink;
  $('#successUrlShort').textContent = storeLink;

  const note = $('#domainNote');
  note.className = '';

  if (value.length < 3) {
    note.textContent = 'Store link needs at least 3 characters.';
    note.className = 'bad';
    return false;
  }

  if (reserved.includes(value) || (s.business && s.business.domain !== value)) {
    note.textContent = 'This store link is already occupied.';
    note.className = 'bad';
    return false;
  }

  note.textContent = '✓ Great news — this store link is available.';
  note.className = 'good';
  return true;
}

$('#domain').oninput = check;

$('#businessForm').onsubmit = (event) => {
  event.preventDefault();

  if (!check() || !$('#name').value.trim() || !/^[6-9]\d{9}$/.test($('#phone').value) || !$('#city').value.trim() || !$('#state').value.trim() || !/^\d{6}$/.test($('#pin').value)) {
    alert('Please fill all required fields with a valid mobile number and pincode.');
    return;
  }

  s.business = {};
  ['domain', 'name', 'phone', 'street', 'city', 'state', 'pin', 'map', 'type'].forEach((key) => {
    s.business[key] = $('#' + key).value.trim();
  });

  save();
  $('#successUrl').textContent = s.business.domain + '.apka.store';
  $('#successUrlShort').textContent = s.business.domain + '.apka.store';
  $('#success').classList.remove('hide');
};

$('#goInventory').onclick = () => {
  $('#success').classList.add('hide');
  openAddProductWindow();
};

$('.back').onclick = () => {
  const inventory = $('#inventory');
  if (inventory && inventory.classList.contains('is-modal')) {
    closeAddProductWindow();
  } else {
    show('business');
  }
};

function renderCats() {
  const out = $('#chips');
  out.innerHTML = s.categories.length
    ? s.categories.map((category, index) => `<span class="chip">${esc(category)} <button type="button" data-x="${index}">×</button></span>`).join('')
    : '<small>No categories yet</small>';

  $('#category').innerHTML = '<option value="">Choose a category</option>' + s.categories.map((category) => `<option>${esc(category)}</option>`).join('');

  $$('[data-x]').forEach((button) => {
    button.onclick = () => {
      s.categories.splice(Number(button.dataset.x), 1);
      save();
      renderCats();
    };
  });
}

$('#addCat').onclick = (event) => {
  event.preventDefault();
  const categoryName = $('#catName').value.trim();

  if (categoryName && !s.categories.some((category) => category.toLowerCase() === categoryName.toLowerCase())) {
    s.categories.push(categoryName);
    $('#catName').value = '';
    save();
    renderCats();
  }
};

$('#variant').onclick = () => {
  const row = document.createElement('div');
  row.className = 'variantRow';
  row.innerHTML = '<input placeholder="Colour e.g. Blue"><input placeholder="Size e.g. XL"><button type="button">×</button>';
  row.querySelector('button').onclick = () => row.remove();
  $('#variantOut').appendChild(row);
};

function drawImgs() {
  $('#photosOut').innerHTML = imgs.map((image) => `<img src="${image}">`).join('');
}

$('#photos').onchange = (event) => {
  const files = [...event.target.files].slice(0, 5);

  if (event.target.files.length > 5) {
    alert('Only 5 photos can be added.');
  }

  if (!files.length) return;

  const firstFile = files.shift();
  const firstReader = new FileReader();
  firstReader.onload = () => {
    $('#cropImg').src = firstReader.result;
    $('#crop').classList.remove('hide');
  };
  firstReader.readAsDataURL(firstFile);

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      imgs.push(reader.result);
      drawImgs();
    };
    reader.readAsDataURL(file);
  });
};

$('#closeCrop').onclick = () => $('#crop').classList.add('hide');
$('#saveCrop').onclick = () => {
  const image = $('#cropImg');
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;

  const scale = Math.max(600 / image.naturalWidth, 800 / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  const context = canvas.getContext('2d');
  context.drawImage(image, (600 - width) / 2, (800 - height) / 2, width, height);
  imgs.push(canvas.toDataURL('image/jpeg', 0.86));
  drawImgs();
  $('#crop').classList.add('hide');
};

$('#video').onchange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.onloadedmetadata = () => {
    if (video.duration > 15) {
      alert('Please upload a video of 15 seconds or less.');
      event.target.value = '';
      return;
    }
    $('#videoOut').innerHTML = `<video controls src="${url}"></video>`;
  };
};

$('#productForm').onsubmit = (event) => {
  event.preventDefault();

  if (!s.categories.length) {
    alert('Create a category first.');
    return;
  }

  if (!event.target.reportValidity()) return;

  s.products.push({
    id: Date.now(),
    name: $('#productName').value.trim(),
    category: $('#category').value,
    price: $('#price').value,
    sizes: $('#sizes').value,
    description: $('#description').value.trim(),
    photos: [...imgs],
    active: true,
  });

  save();
  event.target.reset();
  imgs = [];
  drawImgs();
  $('#variantOut').innerHTML = '';
  $('#videoOut').innerHTML = '';
  alert('Item saved. Add another item or finish.');
};

function dash() {
  show('dashboard');
  $('#dashName').textContent = s.business?.name || 'Store inventory';
  renderDash();
}

$('#finish').onclick = () => {
  closeAddProductWindow();
};

$('#skip').onclick = () => {
  closeAddProductWindow();
};

$('#fab').onclick = openAddProductWindow;
$('#emptyAdd').onclick = openAddProductWindow;
$('#openAddFromHeader').onclick = openAddProductWindow;

function renderDash() {
  $('#pc').textContent = s.products.length;
  $('#cc').textContent = s.categories.length;
  $('#empty').classList.toggle('hide', !!s.products.length);

  const list = $('#list');
  list.innerHTML = s.products.map((product) => `
    <article class="product">
      <div>${product.photos[0] ? `<img src="${product.photos[0]}">` : '<div class="placeholder"></div>'}</div>
      <div>
        <h4>${esc(product.name)}</h4>
        <p>${esc(product.category)}${product.sizes ? ' · ' + esc(product.sizes) : ''}</p>
        <strong>₹${esc(product.price)}</strong>
      </div>
      <div class="actions">
        <button type="button" data-m="${product.id}">⋮</button>
        <button type="button" class="toggle ${product.active ? '' : 'off'}" data-t="${product.id}">● ${product.active ? 'ACTIVE' : 'INACTIVE'}</button>
      </div>
      <div class="menu" id="m${product.id}">
        <button type="button">Edit</button>
        <button type="button" class="delete" data-d="${product.id}">Delete</button>
      </div>
    </article>
  `).join('');

  $$('[data-m]').forEach((button) => {
    button.onclick = () => $(`#m${button.dataset.m}`).classList.toggle('open');
  });

  $$('[data-t]').forEach((button) => {
    button.onclick = () => {
      const product = s.products.find((item) => item.id == button.dataset.t);
      if (product) {
        product.active = !product.active;
        save();
        renderDash();
      }
    };
  });

  $$('[data-d]').forEach((button) => {
    button.onclick = () => {
      if (confirm('Delete this product?')) {
        s.products = s.products.filter((product) => product.id != button.dataset.d);
        save();
        renderDash();
      }
    };
  });
}

$('#share').onclick = async () => {
  const storeLink = 'https://' + (s.business?.domain || 'your-store') + '.apka.store';
  try {
    await navigator.clipboard.writeText(storeLink);
    alert('Store link copied: ' + storeLink);
  } catch (error) {
    alert(storeLink);
  }
};

$('#shareSidebar').onclick = $('#share').onclick;

const searchParams = new URLSearchParams(window.location.search);
if (searchParams.get('flow') === 'register' && !s.business) {
  show('business');
} else if (s.business) {
  ['domain', 'name', 'phone', 'street', 'city', 'state', 'pin', 'map', 'type'].forEach((key) => {
    const element = $('#' + key);
    if (element) {
      element.value = s.business[key] || '';
    }
  });
  check();
  dash();
} else {
  show('business');
}
