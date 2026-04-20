const testRegister = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Siri Naresh",
        email: "siri.naresh193@gmail.com",
        password: "12345678"
      })
    });
    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", data);
  } catch (err) {
    console.error("Error making request:", err.message);
  }
};

testRegister();
