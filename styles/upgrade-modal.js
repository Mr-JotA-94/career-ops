(function () {
  const html = `
<div class="upgrade-overlay" id="upgrade-overlay" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
  <div class="upgrade-modal">
    <button class="upgrade-dismiss" onclick="closeUpgrade()" aria-label="Close">&#x2715;</button>
    <div class="upgrade-badge">Career Ops</div>
    <h2 class="upgrade-title" id="upgrade-title">Unlock full access</h2>
    <p class="upgrade-sub" id="upgrade-sub">This feature is part of Career Ops Full Access.</p>
    <div class="upgrade-options">
      <a href="https://buy.stripe.com/7sY14f0JpcLGbydfd61ck01"
         target="_blank" class="upgrade-btn-primary">Get Full Access &#x2192;</a>
    </div>
    <div class="upgrade-price">
      <strong>Latinos Encorporate members:</strong> use code <strong>LATINOS79</strong> at checkout &#x2014; $79 AUD
      &nbsp;&#xB7;&nbsp; <span class="scratch">$375 full price</span>
    </div>
    <div class="upgrade-price" style="margin-top:4px;">
      Includes 30-min setup session with Johan &#xB7;
      <a href="https://calendly.com/jlopez94f/career-ops-setup-session"
         target="_blank" style="color:var(--teal);text-decoration:none;">Book here</a>
    </div>
    <div class="upgrade-divider"></div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:8px;letter-spacing:0.08em;text-transform:uppercase;">Already have a key?</div>
    <div class="licence-row">
      <input class="licence-input" id="licence-key-input"
             placeholder="COPS-STU-XXXX-XXXX" maxlength="20"
             oninput="this.value=this.value.toUpperCase()">
      <button class="btn-activate" id="btn-activate" onclick="activateLicence()">Activate</button>
    </div>
    <div class="activate-msg" id="activate-msg"></div>
  </div>
</div>`;

  document.body.insertAdjacentHTML('beforeend', html);
}());
