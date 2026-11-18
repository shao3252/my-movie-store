const paymentSettingsForm = document.getElementById("paymentSettingsForm");

async function loadManualPaymentSettings() {
  const { data, error } = await supabaseClient
    .from("manual_payment_settings")
    .select("payment_method,phone,account_name")
    .eq("id", 1)
    .maybeSingle();
  if (error) { setMessage("paymentSettingsMessage", "Imeshindikana kusoma taarifa za malipo."); return; }
  if (data) {
    document.getElementById("paymentMethod").value = data.payment_method;
    document.getElementById("paymentPhone").value = data.phone;
    document.getElementById("paymentAccountName").value = data.account_name;
  }
}

if (paymentSettingsForm) {
  paymentSettingsForm.addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.getElementById("savePaymentSettings");
    button.disabled = true;
    setMessage("paymentSettingsMessage", "");
    const settings = {
      id: 1,
      payment_method: document.getElementById("paymentMethod").value,
      phone: document.getElementById("paymentPhone").value.trim(),
      account_name: document.getElementById("paymentAccountName").value.trim(),
      updated_at: new Date().toISOString()
    };
    if (!/^(?:0[67][0-9]{8}|\\+?255[67][0-9]{8})$/.test(settings.phone)) {
      setMessage("paymentSettingsMessage", "Weka namba sahihi ya simu ya Tanzania.");
      button.disabled = false;
      return;
    }
    const { error } = await supabaseClient.from("manual_payment_settings").upsert(settings, { onConflict: "id" });
    if (error) setMessage("paymentSettingsMessage", "Imeshindikana kuhifadhi: " + error.message);
    else setMessage("paymentSettingsMessage", "Taarifa za malipo zimehifadhiwa.", true);
    button.disabled = false;
  });
}

document.addEventListener("click", async event => {
  const button = event.target.closest("[data-confirm-payment]");
  if (!button) return;
  if (!confirm("Je, umethibitisha kuwa fedha zimeingia kweli?")) return;
  button.disabled = true;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) throw new Error("Tafadhali ingia tena.");
    const response = await fetch(SUPABASE_URL + "/functions/v1/manual-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + session.access_token
      },
      body: JSON.stringify({ action: "confirm_payment", order_id: button.dataset.confirmPayment })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Imeshindikana kuthibitisha malipo.");
    toast("Malipo yamethibitishwa.");
    await loadOrders();
  } catch (error) {
    toast(error.message);
    button.disabled = false;
  }
});

(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) loadManualPaymentSettings();
})();
supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session) loadManualPaymentSettings();
});
