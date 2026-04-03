const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("https://market-project-mspl.onrender.com/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        console.log(data);

        if (res.ok) {
            document.getElementById("result").innerText = "✅ Login Successful";

            // OPTIONAL: store token
            if (data.token) {
                localStorage.setItem("token", data.token);
            }

            // OPTIONAL: redirect
            // window.location.href = "dashboard.html";
        } else {
            document.getElementById("result").innerText = data.message || "❌ Login failed";
        }

    } catch (err) {
        console.error(err);
        document.getElementById("result").innerText = "⚠️ Server error";
    }
});