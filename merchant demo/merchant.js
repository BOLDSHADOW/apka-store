(async () => {
const {
  initializeApp,
} = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js');
const {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js');
const {
  getDownloadURL,
  getStorage,
  ref,
  uploadString,
} = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js');
const {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  deleteDoc,
} = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const firebaseConfig = {
  apiKey: 'AIzaSyAnKvRsz1_bsttCZUzDxROvFFakechrGug',
  authDomain: 'apka-store-1f1df.firebaseapp.com',
  projectId: 'apka-store-1f1df',
  storageBucket: 'apka-store-1f1df.firebasestorage.app',
  messagingSenderId: '631626163938',
  appId: '1:631626163938:web:e9ee057f3335163381a0bb',
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const provider = new GoogleAuthProvider();
const hostname = window.location.hostname.toLowerCase();
const hostSlug = hostname.endsWith('.apka.store') ? hostname.slice(0, -'.apka.store'.length) : '';
const isCustomStoreHost = hostSlug && hostSlug !== 'list' && hostSlug !== 'www';

let currentUser = null;
let storeSlug = isCustomStoreHost ? hostSlug : '';
let storeRef = null;
let s = { categories: [], products: [] };
let imgs = [];
const esc = (value) => {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
};

function setAuthStatus(message) {
  const status = $('#authStatus');
  if (status) status.textContent = message;
}

function showAuthError(error) {
  const messages = {
    'auth/unauthorized-domain': 'Add this website in Firebase Authentication > Settings > Authorized domains.',
    'auth/popup-blocked': 'Allow popups for this website and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  };
  setAuthStatus(messages[error.code] || `Sign-in failed (${error.code || 'unknown error'}).`);
}

function getBusinessForm() {
  const business = {};
  ['domain', 'name', 'phone', 'street', 'city', 'state', 'pin', 'map', 'type'].forEach((key) => {
    business[key] = $('#' + key).value.trim();
  });
  return business;
}

async function loadStore(slug) {
  storeRef = doc(db, 'stores', slug);
  const storeSnapshot = await getDoc(storeRef);
  if (!storeSnapshot.exists()) return false;

  const data = storeSnapshot.data();
  if (data.ownerUid !== currentUser.uid) {
    setAuthStatus('This store belongs to another merchant account.');
    return false;
  }

  const productsSnapshot = await getDocs(query(collection(storeRef, 'products'), orderBy('createdAt', 'asc')));
  s = {
    business: data.business || {},
    categories: data.categories || [],
    products: productsSnapshot.docs.map((product) => ({ id: product.id, ...product.data() })),
  };
  return true;
}

async function loadOwnedStore() {
  const stores = await getDocs(query(collection(db, 'stores'), where('ownerUid', '==', currentUser.uid), limit(1)));
  if (!stores.empty) {
    storeSlug = stores.docs[0].id;
    return loadStore(storeSlug);
  }
  return false;
}

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

$('#businessForm').onsubmit = async (event) => {
  event.preventDefault();

  if (!currentUser) {
    setAuthStatus('Sign in with Google before creating your store.');
    return;
  }

  if (isCustomStoreHost || !check() || !$('#name').value.trim() || !/^[6-9]\d{9}$/.test($('#phone').value) || !$('#city').value.trim() || !$('#state').value.trim() || !/^\d{6}$/.test($('#pin').value)) {
    alert('Please fill all required fields with a valid mobile number and pincode.');
    return;
  }

  const business = getBusinessForm();
  const requestedSlug = business.domain;
  const requestedRef = doc(db, 'stores', requestedSlug);

  try {
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(requestedRef);
      if (existing.exists() && existing.data().ownerUid !== currentUser.uid) {
        throw new Error('STORE_SLUG_TAKEN');
      }
      transaction.set(requestedRef, {
        ownerUid: currentUser.uid,
        business,
        categories: s.categories,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    storeSlug = requestedSlug;
    storeRef = requestedRef;
    s.business = business;
    $('#successUrl').textContent = requestedSlug + '.apka.store';
    $('#successUrlShort').textContent = requestedSlug + '.apka.store';
    $('#success').classList.remove('hide');
  } catch (error) {
    if (error.message === 'STORE_SLUG_TAKEN') {
      $('#domainNote').textContent = 'This store link is already occupied.';
      $('#domainNote').className = 'bad';
    } else {
      console.error('Could not create store:', error);
      setAuthStatus('Could not save your store. Check Firebase Firestore and try again.');
    }
  }
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
    button.onclick = async () => {
      s.categories.splice(Number(button.dataset.x), 1);
      if (storeRef) await updateDoc(storeRef, { categories: s.categories, updatedAt: serverTimestamp() });
      renderCats();
    };
  });
}

$('#addCat').onclick = async (event) => {
  event.preventDefault();
  const categoryName = $('#catName').value.trim();

  if (categoryName && !s.categories.some((category) => category.toLowerCase() === categoryName.toLowerCase())) {
    s.categories.push(categoryName);
    $('#catName').value = '';
    if (storeRef) await updateDoc(storeRef, { categories: s.categories, updatedAt: serverTimestamp() });
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

$('#productForm').onsubmit = async (event) => {
  event.preventDefault();

  if (!s.categories.length) {
    alert('Create a category first.');
    return;
  }

  if (!event.target.reportValidity()) return;

  if (!storeRef) {
    alert('Create your store before adding products.');
    return;
  }

  const productId = doc(collection(storeRef, 'products')).id;
  const photoUrls = await Promise.all(imgs.map(async (image, index) => {
    const imageRef = ref(storage, `stores/${storeSlug}/products/${productId}/${index}.jpg`);
    await uploadString(imageRef, image, 'data_url');
    return getDownloadURL(imageRef);
  }));
  const product = {
    name: $('#productName').value.trim(),
    category: $('#category').value,
    price: $('#price').value,
    sizes: $('#sizes').value,
    description: $('#description').value.trim(),
    photos: photoUrls,
    active: true,
    createdAt: serverTimestamp(),
  };

  const productRef = doc(storeRef, 'products', productId);
  await setDoc(productRef, product);
  s.products.push({ id: productRef.id, ...product, createdAt: new Date() });
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
        if (storeRef) updateDoc(doc(storeRef, 'products', product.id), { active: product.active, updatedAt: serverTimestamp() });
        renderDash();
      }
    };
  });

  $$('[data-d]').forEach((button) => {
    button.onclick = () => {
      if (confirm('Delete this product?')) {
        s.products = s.products.filter((product) => product.id != button.dataset.d);
        if (storeRef) deleteDoc(doc(storeRef, 'products', button.dataset.d));
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
const authButton = $('#authButton');

authButton.onclick = async () => {
  authButton.disabled = true;
  setAuthStatus('Signing in...');
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Merchant Google login failed:', error);
    showAuthError(error);
    authButton.disabled = false;
  }
};

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Could not set Firebase auth persistence:', error);
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) {
    authButton.textContent = 'Sign in with Google';
    show('business');
    setAuthStatus('Sign in to manage your store.');
    return;
  }

  authButton.textContent = 'Sign out';
  authButton.disabled = false;
  authButton.onclick = () => signOut(auth);
  setAuthStatus(`Signed in as ${user.email || user.displayName || 'merchant'}.`);

  try {
    const loaded = isCustomStoreHost
      ? await loadStore(storeSlug)
      : await loadOwnedStore();

    if (loaded) {
      ['domain', 'name', 'phone', 'street', 'city', 'state', 'pin', 'map', 'type'].forEach((key) => {
        const element = $('#' + key);
        if (element) element.value = s.business[key] || '';
      });
      check();
      dash();
      setAuthStatus(`Signed in as ${user.email || user.displayName || 'merchant'}.`);
    } else if (isCustomStoreHost) {
      show('business');
      setAuthStatus('This store does not exist or is not owned by this account.');
    } else {
      show('business');
    }
  } catch (error) {
    console.error('Could not load merchant store:', error);
    show('business');
    setAuthStatus('Could not load your store. Check Firebase Firestore and try again.');
  }
});
})();
