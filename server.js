const express = require("express");
const session = require("express-session");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "cinema-secret-key-123",
  resave: false,
  saveUninitialized: true
}));

const movies = [
  { id: 1, title: "Avengers", rating: 9.2, price: 1500 },
  { id: 2, title: "Interstellar", rating: 9.5, price: 2000 },
  { id: 3, title: "Batman", rating: 8.7, price: 1200 },
];

const seats = [
  ["A1","A2","A3","A4","A5","A6"],
  ["B1","B2","B3","B4","B5","B6"],
  ["C1","C2","C3","C4","C5","C6"],
  ["VIP1","VIP2","VIP3","VIP4","VIP5","VIP6"],
];

app.get("/", (req, res) => {
  let sorted = [...movies].sort((a,b) => b.rating - a.rating);
  res.send(`
    <h1>🎬 Кино таңдау</h1>
    ${sorted.map(m => `
      <div style="border:1px solid #ccc;padding:10px;margin:10px">
        <h2>${m.title}</h2>
        <p>⭐ ${m.rating}</p>
        <p>💰 ${m.price} ₸</p>
        <form method="POST" action="/movie">
          <input type="hidden" name="id" value="${m.id}">
          <button>Таңдау</button>
        </form>
      </div>
    `).join("")}
  `);
});

app.post("/movie", (req, res) => {
  req.session.selectedMovie = movies.find(m => m.id == req.body.id);
  res.redirect("/cinema");
});

app.get("/cinema", (req, res) => {
  if (!req.session.selectedMovie) return res.redirect("/");
  res.send(`
    <h1>🏢 Кинотеатр таңда</h1>
    <p>🎬 Таңдалған фильм: <b>${req.session.selectedMovie.title}</b></p>
    <form method="POST" action="/cinema">
      <button name="cinema" value="Mega">Mega Cinema</button>
      <button name="cinema" value="City">City Cinema</button>
      <button name="cinema" value="Almaty">Almaty Cinema</button>
    </form>
  `);
});

app.post("/cinema", (req, res) => {
  req.session.selectedCinema = req.body.cinema;
  res.redirect("/seats");
});

app.get("/seats", (req, res) => {
  if (!req.session.selectedMovie || !req.session.selectedCinema) return res.redirect("/");
  res.send(`
    <h1>🪑 Орын таңда</h1>
    <p>🎬 ${req.session.selectedMovie.title}</p>
    <p>🏢 ${req.session.selectedCinema}</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${seats.map(row => `
        <div style="display:flex;gap:10px;justify-content:center">
          ${row.map(s => {
            let color = s.includes("VIP") ? "gold" : "lightgreen";
            return `
              <form method="POST" action="/seat">
                <input type="hidden" name="seat" value="${s}">
                <button style="width:60px;height:40px;background:${color};border:none;cursor:pointer;">${s}</button>
              </form>
            `;
          }).join("")}
        </div>
      `).join("")}
    </div>
  `);
});

app.post("/seat", (req, res) => {
  req.session.selectedSeat = req.body.seat;
  res.redirect("/payment");
});

app.get("/payment", (req, res) => {
  const { selectedMovie, selectedCinema, selectedSeat } = req.session;
  if (!selectedMovie || !selectedCinema || !selectedSeat) return res.redirect("/");
  let finalPrice = selectedMovie.price;
  if (selectedSeat.includes("VIP")) finalPrice += 1000;
  req.session.finalPrice = finalPrice;
  res.send(`
    <h1>💳 Төлем</h1>
    <p>🎬 Фильм: ${selectedMovie.title}</p>
    <p>🏢 Кинотеатр: ${selectedCinema}</p>
    <p>🪑 Орын: ${selectedSeat}</p>
    <p>💰 Төленетін сомма: <b>${finalPrice} ₸</b></p>
    <form method="POST" action="/pay">
      <input name="card" placeholder="16 digit card number" pattern="[0-9]{16}" required /><br><br>
      <input name="cvv" placeholder="CVV (123)" pattern="[0-9]{3}" required /><br><br>
      <input name="email" type="email" placeholder="Email" required /><br><br>
      <button>Төлеу</button>
    </form>
  `);
});

app.post("/pay", (req, res) => {
  const { selectedMovie, selectedCinema, selectedSeat, finalPrice } = req.session;
  if (!selectedMovie) return res.redirect("/");
  let ticketId = Math.floor(Math.random() * 1000000);
  res.send(`
    <div style="font-family:Arial;text-align:center">
      <h1>✅ Төлем сәтті өтті!</h1>
      <h2>🎟 СІЗДІҢ БИЛЕТ</h2>
      <div style="border:2px dashed black;padding:20px;display:inline-block">
        <p>🎬 Фильм: ${selectedMovie.title}</p>
        <p>🏢 Кинотеатр: ${selectedCinema}</p>
        <p>🪑 Орын: ${selectedSeat}</p>
        <p>💰 Баға: ${finalPrice} ₸</p>
        <p>🆔 Ticket ID: ${ticketId}</p>
      </div>
      <h3>📩 Билет ${req.body.email} поштасына жіберілді</h3>
      <a href="/">🔙 Басқа фильм таңдау</a>
    </div>
  `);
  req.session.destroy();
});

app.listen(3000, () => {
  console.log("🎬 CINEMA running on http://localhost:3000");
});