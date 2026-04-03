const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "index.html";
}

// ADD PRODUCT
async function addProduct() {
    const name = document.getElementById("name").value;
    const price = document.getElementById("price").value;
    const category = document.getElementById("category").value;

    const res = await fetch("https://market-project-mspl.onrender.com/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify({ name, price, category })
    });

    alert(await res.text());
}

// LOAD DATA
async function loadData() {
    const res = await fetch("https://market-project-mspl.onrender.com/data", {
        headers: {
            "Authorization": token
        }
    });

    const data = await res.json();

    const list = document.getElementById("list");
    list.innerHTML = "";

    data.forEach(item => {
        const li = document.createElement("li");
        li.innerText = `${item.name} - ₹${item.price} - ${item.category}`;
        list.appendChild(li);
    });
}

// PREDICT
async function predictPrice() {
    const res = await fetch("https://market-project-mspl.onrender.com/predict", {
        headers: {
            "Authorization": token
        }
    });

    const data = await res.json();
    document.getElementById("prediction").innerText =
        "Predicted Price: ₹" + data.predictedPrice;
}

// LOGOUT
function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}