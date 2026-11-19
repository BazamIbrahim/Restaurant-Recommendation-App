import { createClient } from '@supabase/supabase-js';
import { markets } from './markets.js';
const config = {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};
const supabase = config.url && config.key
  ? createClient(config.url, config.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

let query = 'masala dosa';
let session = null;
let createMode = false;
let pendingSave = false;
let recoveryMode = false;
let previewUrl = null;
let selectedPhoto = null;
let researchModelReady = false;
let selectedMarket = markets.find((market) => market.iso2 === 'IE');

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="#discover" aria-label="NEMO home"><span class="brand-mark">n</span><span>NEMO</span></a>
    <nav aria-label="Main navigation"><a href="#discover" class="nav-active">Discover</a><a href="#how">How it works</a></nav>
    <div class="account"><label class="market-picker"><span class="pin" aria-hidden="true">⌖</span><select id="market-select" aria-label="Choose country and capital"></select></label><button class="login-button" id="account-button" type="button">Log in</button><button class="avatar" id="saved-button" type="button" aria-label="View saved searches">♡</button></div>
  </header>
  <main id="discover">
    <section class="hero"><div class="hero-copy"><span class="eyebrow"><i></i> A taste of home, wherever you are</span><h1>What are you<br/>craving <em>today?</em></h1><p>Show us a dish you love. We’ll help you find a familiar bite nearby.</p></div><div class="hero-art" aria-hidden="true"><div class="sun"></div><div class="art-plate"><div class="plate-food">🥘</div></div><div class="art-leaf leaf-one">✳</div><div class="art-leaf leaf-two">✦</div><span class="art-note">Good food<br/>brings us home.</span></div></section>
    <section class="search-panel" aria-label="Find food"><div class="search-tabs"><button class="tab active" type="button" data-tab="photo">⌁ &nbsp;Use a photo</button><button class="tab" type="button" data-tab="text">⌕ &nbsp;Search by dish</button></div>
      <div class="photo-panel" id="photo-panel"><div class="photo-actions"><label class="upload-zone" for="food-photo" id="drop-zone"><span class="upload-icon">↑</span><span><strong>Choose or drop a food photo</strong><small>JPG, PNG, or WebP · up to 10 MB</small></span><span class="privacy-note">Sent to local model only when you search</span></label><button class="camera-button" id="take-photo" type="button">◎ <span>Take a photo</span></button></div><div class="model-status" id="model-status" role="status" aria-live="polite">Checking local research model…</div><input id="food-photo" type="file" accept="image/jpeg,image/png,image/webp" hidden /><input id="camera-photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden /></div>
      <div class="text-panel hidden" id="text-panel"><label class="dish-input"><span aria-hidden="true">⌕</span><input id="dish-search" value="masala dosa" maxlength="100" placeholder="Type a dish you love" aria-label="Dish to search"/><button id="search-button" type="button">Find places <span>→</span></button></label><small class="suggestion-label">TRY A DISH</small><div class="suggestions"><button type="button">Jollof rice</button><button type="button">Ramen</button><button type="button">Arepas</button><button type="button">Pad thai</button></div></div>
      <div class="photo-result hidden" id="photo-result"></div>
    </section>
    <section class="results-head"><div><span class="eyebrow section-eyebrow" id="result-mode">PUBLIC MAP SEARCH</span><h2>Find a taste of home nearby <span class="result-count" id="result-count">—</span></h2><p><span id="result-description">OpenStreetMap place search for </span><strong id="query-label">Masala dosa</strong><span id="market-context"> · Dublin</span></p></div><div class="result-actions"><button class="save-search-button" id="save-search" type="button">♡ <span>Save search</span></button><a class="public-map-shortcut" id="public-map-shortcut" href="https://www.openstreetmap.org/search?query=restaurant%20Dublin%2C%20Ireland" target="_blank" rel="noopener noreferrer">Browse places ↗</a></div></section>
    <section class="results-layout"><div class="place-list" id="place-list" aria-live="polite"></div><aside class="map-card" id="map-card" aria-label="Map preview"><div class="map-label"><span class="live-dot" id="map-dot"></span><span id="map-label">MAP PREVIEW · NOT LIVE</span><span class="map-expand" id="map-expand">DUBLIN</span></div><div class="map-canvas" id="map-canvas"><div class="river"></div><div class="street street-a"></div><div class="street street-b"></div><div class="street street-c"></div><div class="street street-d"></div><div class="block block-a"></div><div class="block block-b"></div><div class="block block-c"></div><div class="block block-d"></div><div class="block block-e"></div><div class="map-park">ST STEPHEN’S<br/>GREEN</div><div id="map-pins"></div><div class="you-pin"><span></span></div><span class="map-text text-one">GRAFTON ST</span><span class="map-text text-two">RIVER LIFFEY</span><span class="map-text text-three">TEMPLE BAR</span><div class="map-credit">Illustration · locations are examples</div></div><div class="map-empty hidden" id="map-empty"><strong>Map preview unavailable</strong><span>Restaurant and map coverage has not been verified for this capital yet.</span></div><div class="map-footer"><span id="map-center"><i class="you-dot"></i> Dublin demo centre</span><a id="map-link" href="https://www.openstreetmap.org/search?query=Dublin%20Ireland" target="_blank" rel="noreferrer">Explore Dublin map ↗</a></div></aside></section>
    <section class="trust-strip"><span>✳ &nbsp;Thoughtful recommendations</span><span>⌖ &nbsp;Built for curious travellers</span><span>♡ &nbsp;Photos stay on your device</span></section>
  </main>
  <footer id="how"><a class="brand footer-brand" href="#discover"><span class="brand-mark">n</span><span>NEMO</span></a><p>Find your kind of food, wherever you are.</p><span class="footer-note" id="footer-note">Dublin demo · Sample places and scores only</span></footer>
  <dialog id="auth-dialog" aria-labelledby="auth-title"><form method="dialog" class="dialog-close"><button aria-label="Close sign-in dialog" type="submit">×</button></form><div class="auth-mark">n</div><span class="eyebrow">WELCOME TO NEMO</span><h2 id="auth-title">Find a taste of home.</h2><p class="auth-copy">Sign in to save your food searches securely.</p><form id="auth-form"><label>Email address<input type="email" id="auth-email" required autocomplete="email" maxlength="254" placeholder="you@example.com"/></label><label>Password<input type="password" id="auth-password" required minlength="8" maxlength="72" autocomplete="current-password" placeholder="At least 8 characters"/></label><button class="auth-submit" type="submit">Continue <span>→</span></button><p id="auth-message" role="status" aria-live="polite"></p></form><div class="auth-links"><button class="auth-toggle" id="auth-toggle" type="button">New to NEMO? <strong>Create an account</strong></button><button class="reset-password" id="reset-password" type="button">Forgot password?</button></div><p class="auth-foot">Supabase handles your password. NEMO does not store it.</p></dialog>
  <dialog id="saved-dialog" aria-labelledby="saved-title"><form method="dialog" class="dialog-close"><button aria-label="Close saved searches" type="submit">×</button></form><span class="eyebrow">YOUR ACCOUNT</span><h2 id="saved-title">Saved searches</h2><div id="saved-list" class="saved-list"></div><p class="auth-foot">Only you can access your saved searches. You can remove them here.</p></dialog>
  <div id="toast" role="status" aria-live="polite" class="toast"></div>`;

const $ = (selector) => document.querySelector(selector);
const authDialog = $('#auth-dialog');
const savedDialog = $('#saved-dialog');
const marketSelect = $('#market-select');
for (const market of markets) {
  const option = document.createElement('option');
  option.value = market.iso2;
  option.textContent = `${market.country} — ${market.capital}`;
  marketSelect.append(option);
}
marketSelect.value = selectedMarket.iso2;
marketSelect.addEventListener('change', () => {
  selectedMarket = markets.find((market) => market.iso2 === marketSelect.value) || markets.find((market) => market.iso2 === 'IE');
  updateMarketInterface();
});

async function loadModelStatus() {
  const label = $('#model-status');
  try {
    const response = await fetch('/api/model-status', { headers: { Accept: 'application/json' } });
    const status = await response.json();
    researchModelReady = response.ok && status.ready === true;
    label.textContent = researchModelReady
      ? `Research model ready · ${status.classes} Food-101 labels · test top-1 ${(status.top1Accuracy * 100).toFixed(1)}%`
      : `Image model unavailable · ${status.message || 'start the local research server'}`;
    label.classList.toggle('model-ready', researchModelReady);
  } catch {
    researchModelReady = false;
    label.textContent = 'Image model unavailable · start NEMO with npm run dev';
    label.classList.remove('model-ready');
  }
  const button = $('#search-image-button');
  if (button) {
    button.disabled = !researchModelReady || !selectedPhoto;
    button.textContent = researchModelReady ? 'Search this image' : 'Local model unavailable';
  }
}

function showToast(text) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3500);
}

function updateMarketInterface() {
  const isDublinDemo = selectedMarket.iso2 === 'IE';
  const marketLabel = `${selectedMarket.capital}, ${selectedMarket.country}`;
  $('#market-context').textContent = ` · ${selectedMarket.capital}`;
  $('#result-description').textContent = 'OpenStreetMap place search for ';
  $('#result-mode').textContent = 'PUBLIC MAP SEARCH';
  $('#map-expand').textContent = selectedMarket.capital.toLocaleUpperCase();
  $('#map-label').textContent = 'OPENSTREETMAP · LIVE SEARCH';
  $('#map-dot').classList.add('coverage-pending-dot');
  $('#map-canvas').classList.add('hidden');
  $('#map-empty').classList.remove('hidden');
  $('#map-empty strong').textContent = 'Explore real places on OpenStreetMap';
  $('#map-empty span').textContent = 'NEMO does not yet have a verified restaurant and menu database for this city. Open the public map to check nearby places.';
  $('#map-center').innerHTML = `<i class="you-dot"></i> ${escapeHtml(marketLabel)}`;
  $('#map-link').href = `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${query} restaurant ${marketLabel}`)}`;
  $('#map-link').textContent = `Search ${selectedMarket.capital} ↗`;
  $('#map-card').setAttribute('aria-label', `OpenStreetMap search for ${marketLabel}`);
  $('#footer-note').textContent = 'Restaurant discovery opens OpenStreetMap · NEMO listings are not verified yet';
  renderPlaces();
}

function renderPlaces() {
  const location = `${selectedMarket.capital}, ${selectedMarket.country}`;
  const searchText = `restaurant ${location}`;
  const mapSearchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(searchText)}`;
  $('#result-count').textContent = '—';
  $('#place-list').innerHTML = `<div class="public-search-card"><span class="public-search-eyebrow">PUBLIC MAP DATA · OPENSTREETMAP</span><h3>Look for ${escapeHtml(query)} around ${escapeHtml(selectedMarket.capital)}</h3><p>Open the public map to browse nearby restaurant records. Map data may not include menus or reviews, so check with the restaurant before you go.</p><a class="public-search-button" href="${mapSearchUrl}" target="_blank" rel="noopener noreferrer">Browse restaurants in ${escapeHtml(selectedMarket.capital)} <span aria-hidden="true">↗</span></a><small>NEMO hasn’t verified these places or confirmed that they serve ${escapeHtml(query)}.</small></div>`;
  $('#map-link').href = mapSearchUrl;
  $('#public-map-shortcut').href = mapSearchUrl;
  $('#map-pins').replaceChildren();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function runSearch(value) {
  const cleaned = value.trim().replace(/\s+/g, ' ').slice(0, 100);
  if (!cleaned) {
    showToast('Enter a dish name to search.');
    $('#dish-search').focus();
    return;
  }
  query = cleaned;
  $('#query-label').textContent = query;
  renderPlaces();
  showToast(`Opening public place data for “${query}” in ${selectedMarket.capital}.`);
}

function resetPhotoPreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  selectedPhoto = null;
  $('#photo-result').replaceChildren();
  $('#photo-result').classList.add('hidden');
}

async function searchUploadedImage(file, button, message, results) {
  button.disabled = true;
  button.classList.add('is-loading');
  button.innerHTML = '<span class="search-spinner" aria-hidden="true"></span> Comparing food photos…';
  button.setAttribute('aria-busy', 'true');
  message.textContent = 'Comparing your photo with labeled food images. This can take a little while.';
  results.replaceChildren();
  try {
    const response = await fetch('/api/search-image', {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Image search failed.');
    message.textContent = 'Ranked by visual similarity to labeled training photos. Cosine similarity is a comparison score, not certainty; Food-101 covers 101 dishes.';

    const visualTitle = document.createElement('strong');
    visualTitle.className = 'visual-match-title';
    visualTitle.textContent = 'Closest visual matches';
    const intro = document.createElement('span');
    intro.className = 'visual-match-intro';
    intro.textContent = `Based on the ${data.nearest_neighbors?.length || data.cosine_knn_examples?.[0]?.neighbors_considered || 5} most similar labeled photos`;
    results.append(visualTitle, intro);

    const similar = data.cosine_knn_examples || [];
    const useDish = (dish) => {
      $('[data-tab="text"]').click();
      $('#dish-search').value = dish;
      runSearch(dish);
    };
    if (similar.length) {
      for (const [index, item] of similar.slice(0, 3).entries()) {
        const card = document.createElement('article');
        card.className = `visual-match-card${index === 0 ? ' visual-match-best' : ''}`;
        const rank = document.createElement('span');
        rank.className = 'visual-match-rank';
        rank.textContent = index === 0 ? 'BEST VISUAL MATCH' : `MATCH ${index + 1}`;
        const heading = document.createElement('strong');
        heading.className = 'visual-match-name';
        heading.textContent = item.dish_name;
        const evidence = document.createElement('span');
        evidence.className = 'visual-match-evidence';
        evidence.textContent = `${item.examples} of ${item.neighbors_considered || 5} nearest photos · closest photo ${(item.best_similarity * 100).toFixed(1)}% similar`;
        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'match-search-button';
        action.textContent = `Find ${item.dish_name} nearby`;
        action.addEventListener('click', () => useDish(item.dish_name));
        card.append(rank, heading, evidence, action);
        results.append(card);
      }
    } else {
      const empty = document.createElement('p');
      empty.className = 'no-visual-matches';
      empty.textContent = 'No close photo matches were found in this research dataset. Try a clearer photo or search by dish name.';
      results.append(empty);
    }

    const predictions = data.predictions || [];
    if (predictions.length) {
      const details = document.createElement('details');
      details.className = 'classifier-details';
      const summary = document.createElement('summary');
      summary.textContent = 'Other model label suggestions';
      details.append(summary);
      const note = document.createElement('span');
      note.className = 'classifier-note';
      note.textContent = 'Classifier scores are not confidence and are separate from visual-neighbor ranking.';
      details.append(note);
      for (const prediction of predictions.slice(0, 5)) {
        const row = document.createElement('div');
        row.className = 'prediction-row';
        const name = document.createElement('span');
        name.textContent = prediction.dish_name;
        const score = document.createElement('small');
        score.textContent = `model score ${(prediction.score * 100).toFixed(1)}%`;
        const action = document.createElement('button');
        action.type = 'button';
        action.textContent = 'Find nearby';
        action.addEventListener('click', () => useDish(prediction.dish_name));
        row.append(name, score, action);
        details.append(row);
      }
      results.append(details);
    }
  } catch (error) {
    message.textContent = error.message || 'Could not run the local model. Check that NEMO is started with npm run dev.';
  } finally {
    button.disabled = !researchModelReady;
    button.classList.remove('is-loading');
    button.removeAttribute('aria-busy');
    button.textContent = researchModelReady ? '↻  Search again' : 'Local model unavailable';
  }
}

function handlePhoto(file) {
  resetPhotoPreview();
  if (!file) return;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Choose a JPG, PNG, or WebP image.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('That image is over 10 MB. Choose a smaller photo.');
    return;
  }
  selectedPhoto = file;
  previewUrl = URL.createObjectURL(file);
  const image = document.createElement('img');
  image.src = previewUrl;
  image.alt = 'Your selected food photo, previewed on this device';
  const details = document.createElement('div');
  details.className = 'photo-result-content';
  const heading = document.createElement('strong');
  heading.textContent = 'Your food photo';
  heading.className = 'photo-result-heading';
  const note = document.createElement('span');
  note.textContent = 'The photo stays in this browser until you search. Searching sends it only to this device’s local research server; it is not retained.';
  const searchButton = document.createElement('button');
  searchButton.type = 'button';
  searchButton.id = 'search-image-button';
  searchButton.className = 'image-search-button';
  searchButton.disabled = !researchModelReady;
  searchButton.innerHTML = researchModelReady ? '⌕ &nbsp; Find similar dishes' : 'Local model unavailable';
  searchButton.setAttribute('aria-label', 'Find dishes visually similar to this photo');
  const results = document.createElement('div');
  results.className = 'image-model-results';
  searchButton.addEventListener('click', () => searchUploadedImage(file, searchButton, note, results));
  details.append(heading, note, searchButton, results);
  $('#photo-result').append(image, details);
  $('#photo-result').classList.remove('hidden');
  loadModelStatus();
}

async function saveCurrentSearch() {
  if (!supabase) {
    showToast('Saving needs a Supabase project. Configure .env.local first.');
    return;
  }
  if (!session) {
    pendingSave = true;
    authDialog.showModal();
    showToast('Sign in to save this search.');
    return;
  }
  try {
    const { error } = await supabase.from('saved_searches').insert({
      user_id: session.user.id,
      dish_name: query,
      country_code: selectedMarket.iso2,
      city: selectedMarket.capital,
    });
    if (error) {
      if (error.code === '23505') showToast('This search is already saved.');
      else showToast(error.message.includes('saved_searches') ? 'Apply the NEMO database migration before saving.' : 'Could not save this search. Please try again.');
      return;
    }
    pendingSave = false;
    showToast('Search saved to your account.');
  } catch {
    showToast('Could not reach NEMO right now. Check your connection and try again.');
  }
}

async function loadSavedSearches() {
  if (!supabase) {
    $('#saved-list').textContent = 'Saved searches become available after Supabase is configured.';
    return;
  }
  if (!session) {
    savedDialog.close();
    authDialog.showModal();
    showToast('Log in to view your saved searches.');
    return;
  }
  $('#saved-list').textContent = 'Loading…';
  savedDialog.showModal();
  let data;
  let error;
  try {
    ({ data, error } = await supabase.from('saved_searches').select('id,dish_name,country_code,city,created_at').order('created_at', { ascending: false }));
  } catch {
    $('#saved-list').textContent = 'Could not reach NEMO. Check your connection and try again.';
    return;
  }
  if (error) {
    $('#saved-list').textContent = 'Could not load saved searches. Check the database migration and try again.';
    return;
  }
  if (!data.length) {
    $('#saved-list').textContent = 'No saved searches yet. Use “Save search” on a dish you want to remember.';
    return;
  }
  const list = document.createElement('ul');
  for (const item of data) {
    const row = document.createElement('li');
    const open = document.createElement('button');
    open.type = 'button';
    open.textContent = `${item.dish_name} · ${item.city}, ${item.country_code}`;
    open.addEventListener('click', () => {
      selectedMarket = markets.find((market) => market.iso2 === item.country_code) || markets.find((market) => market.iso2 === 'IE');
      marketSelect.value = selectedMarket.iso2;
      updateMarketInterface();
      runSearch(item.dish_name);
      savedDialog.close();
      $('[data-tab="text"]').click();
      $('#dish-search').value = item.dish_name;
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-saved';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove saved search ${item.dish_name}`);
    remove.addEventListener('click', async () => {
      let deleteError;
      try {
        ({ error: deleteError } = await supabase.from('saved_searches').delete().eq('id', item.id));
      } catch {
        showToast('Could not reach NEMO. Check your connection and try again.');
        return;
      }
      if (deleteError) showToast('Could not remove this saved search.');
      else {
        row.remove();
        if (!list.children.length) $('#saved-list').textContent = 'No saved searches yet.';
        showToast('Saved search removed.');
      }
    });
    row.append(open, remove);
    list.append(row);
  }
  $('#saved-list').replaceChildren(list);
}

function updateAccountButton() {
  $('#account-button').textContent = session ? 'Log out' : 'Log in';
  $('#account-button').setAttribute('aria-label', session ? 'Log out of NEMO' : 'Log in to NEMO');
}

document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
  $('#photo-panel').classList.toggle('hidden', button.dataset.tab !== 'photo');
  $('#text-panel').classList.toggle('hidden', button.dataset.tab !== 'text');
  if (button.dataset.tab === 'text') resetPhotoPreview();
}));

$('#search-button').addEventListener('click', () => runSearch($('#dish-search').value));
$('#dish-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch(event.target.value); });
document.querySelectorAll('.suggestions button').forEach((button) => button.addEventListener('click', () => {
  $('#dish-search').value = button.textContent;
  runSearch(button.textContent);
}));
for (const input of [$('#food-photo'), $('#camera-photo')]) {
  input.addEventListener('change', (event) => {
    handlePhoto(event.target.files?.[0]);
    event.target.value = '';
  });
}
$('#take-photo').addEventListener('click', () => $('#camera-photo').click());
const dropZone = $('#drop-zone');
for (const name of ['dragenter', 'dragover']) dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add('dragging'); });
for (const name of ['dragleave', 'drop']) dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove('dragging'); });
dropZone.addEventListener('drop', (event) => handlePhoto(event.dataTransfer.files?.[0]));
$('#save-search').addEventListener('click', saveCurrentSearch);
$('#saved-button').addEventListener('click', loadSavedSearches);

$('#account-button').addEventListener('click', async () => {
  if (session && supabase) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) showToast('Could not log out. Try again.');
      else {
        session = null;
        updateAccountButton();
        showToast('You are logged out.');
      }
    } catch {
      showToast('Could not reach NEMO. Check your connection and try again.');
    }
    return;
  }
  authDialog.showModal();
});

$('#auth-toggle').addEventListener('click', () => {
  createMode = !createMode;
  $('#auth-title').textContent = createMode ? 'Create your NEMO account.' : 'Find a taste of home.';
  $('#auth-toggle').innerHTML = createMode ? 'Already have an account? <strong>Log in</strong>' : 'New to NEMO? <strong>Create an account</strong>';
  $('#auth-password').autocomplete = createMode ? 'new-password' : 'current-password';
  $('#reset-password').classList.toggle('hidden', createMode);
  $('#auth-message').textContent = '';
});

$('#auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = $('#auth-message');
  if (!supabase) {
    message.textContent = 'Sign-in is not configured. Add the Supabase project URL and publishable key to .env.local; guest browsing still works.';
    return;
  }
  const email = $('#auth-email').value.trim();
  const password = $('#auth-password').value;
  message.textContent = 'Please wait…';
  let result;
  try {
    result = recoveryMode
      ? await supabase.auth.updateUser({ password })
      : createMode
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
        : await supabase.auth.signInWithPassword({ email, password });
  } catch {
    message.textContent = 'Could not reach NEMO. Check your connection and try again.';
    return;
  }
  if (result.error) {
    message.textContent = 'We could not complete that request. Check your details and try again.';
    return;
  }
  if (createMode && !result.data.session) {
    message.textContent = 'Check your email for a confirmation link, then return here to log in.';
    return;
  }
  const createdAccount = createMode;
  session = recoveryMode ? session : result.data.session;
  if (recoveryMode) {
    recoveryMode = false;
    createMode = false;
    $('#auth-password').value = '';
    $('#auth-title').textContent = 'Find a taste of home.';
    $('#auth-toggle').classList.remove('hidden');
    $('#reset-password').classList.remove('hidden');
    $('.auth-submit').firstChild.textContent = 'Continue ';
  }
  createMode = false;
  $('#auth-title').textContent = 'Find a taste of home.';
  $('#auth-toggle').innerHTML = 'New to NEMO? <strong>Create an account</strong>';
  $('#auth-password').autocomplete = 'current-password';
  updateAccountButton();
  authDialog.close();
  if (pendingSave) await saveCurrentSearch();
  else showToast(createdAccount ? 'Your account is ready.' : 'Welcome back.');
});

$('#reset-password').addEventListener('click', async () => {
  if (!supabase) {
    $('#auth-message').textContent = 'Password reset needs the Supabase project configured.';
    return;
  }
  const email = $('#auth-email').value.trim();
  if (!email) {
    $('#auth-message').textContent = 'Enter your email address first.';
    $('#auth-email').focus();
    return;
  }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    $('#auth-message').textContent = error ? 'Could not send a reset link. Please try again.' : 'If this account can receive a reset email, a link is on its way.';
  } catch {
    $('#auth-message').textContent = 'Could not reach NEMO. Check your connection and try again.';
  }
});

updateMarketInterface();
loadModelStatus();
if (supabase) {
  supabase.auth.onAuthStateChange((event, nextSession) => {
    session = nextSession;
    updateAccountButton();
    if (event === 'PASSWORD_RECOVERY') {
      recoveryMode = true;
      createMode = false;
      $('#auth-title').textContent = 'Set a new password.';
      $('#auth-toggle').classList.add('hidden');
      $('#reset-password').classList.add('hidden');
      $('.auth-submit').firstChild.textContent = 'Update password ';
      authDialog.showModal();
    }
  });
  supabase.auth.getSession().then(({ data }) => {
    session = data.session;
    updateAccountButton();
  }).catch(() => showToast('Could not restore your account session. Log in again if needed.'));
}
window.addEventListener('beforeunload', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });
