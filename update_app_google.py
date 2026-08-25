import re

with open("customer/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make sure authApi is imported
if "loginWithGoogle" not in content:
    content = content.replace("loginCustomer, loginGuest", "loginCustomer, loginGuest, loginWithGoogle")

# Update ModernWelcome invocation
old_welcome = """<ModernWelcome onCredential={async (draftClient) => { if (draftClient) { try { const saved = await registerPublicCustomer(draftClient); activateClient(saved); } catch (error) { showError(error); return; } } go("home"); }} onRecover={() => go("recover")} />"""

new_welcome = """<ModernWelcome 
  onCredential={async (draftClient) => { 
    if (draftClient) { 
      try { 
        const saved = await registerPublicCustomer(draftClient); 
        activateClient(saved); 
      } catch (error) { 
        showError(error); 
        return; 
      } 
    } 
    go("home"); 
  }} 
  onRecover={() => go("recover")} 
  onGoogleCredential={async (credential) => {
    try {
      const session = await loginWithGoogle(credential);
      const savedClient = { ...(session.client || {}), reservationDraftClient: true, customerScope: true };
      localStorage.setItem("pp_customer_token", session.token);
      localStorage.setItem("pp_customer_client", JSON.stringify(savedClient));
      setClient(savedClient);
      go("home");
    } catch (error) {
      showError(error);
    }
  }}
/>"""

if old_welcome in content:
    content = content.replace(old_welcome, new_welcome)
    with open("customer/src/App.jsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("App.jsx updated with Google Auth")
else:
    print("Could not find ModernWelcome in App.jsx")

