// --- 🔗 CONFIG ---
const supabaseUrl = 'https://meyqbmfbmgzumsactbdw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leXFibWZibWd6dW1zYWN0YmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODQ5MDUsImV4cCI6MjA4MjA2MDkwNX0.QbP3qTonv6wo32x1mcRKulJcNQ7H4KP_2W2ScsEKtFU'
const _supabase = supabase.createClient(supabaseUrl, supabaseKey)
let globalData = []; 

// ตั้งค่าปุ่มเลือกวัน
const datePicker = document.getElementById('datePicker');
datePicker.valueAsDate = new Date();
datePicker.addEventListener('change', fetchData);

// --- 📊 สร้างกราฟ (7 เส้น รวม Light) ---
const ctx = document.getElementById('myChart').getContext('2d');
const weatherChart = new Chart(ctx, {
    type: 'line',
    data: { 
        labels: [], 
        datasets: [
            // 1. Temp
            { label: 'Temp (°C)', data: [], borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', yAxisID: 'y', tension: 0.4 },
            // 2. Humidity (แกนขวา)
            { label: 'Humidity (%)', data: [], borderColor: '#0dcaf0', yAxisID: 'y1', borderDash: [5, 5], tension: 0.4 },
            // 3. Wind
            { label: 'Wind (m/s)', data: [], borderColor: '#ffc107', yAxisID: 'y', tension: 0.4 },
            // 4. Rain
            { label: 'Rain (mm)', data: [], borderColor: '#0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.2)', fill: true, yAxisID: 'y', tension: 0.1 },
            // 5. UV
            { label: 'UV Index', data: [], borderColor: '#6f42c1', yAxisID: 'y', tension: 0.4 },
            // 6. Light (เหลืองสว่าง - ซ่อนไว้ก่อน เพราะค่า Lux สูงมาก)
            { label: 'Light (Lux)', data: [], borderColor: '#fd7e14', yAxisID: 'y_lux', hidden: true, tension: 0.4 },
            // 7. Pressure (เทา - ซ่อนไว้ก่อน)
            { label: 'Pressure (hPa)', data: [], borderColor: '#6c757d', yAxisID: 'y_pres', hidden: true, tension: 0.4 }
        ]
    },
    options: { 
        responsive: true, 
        interaction: { mode: 'index', intersect: false },
        scales: {
            y: { type: 'linear', display: true, position: 'left', title: {display:true, text:'General'} },
            y1: { type: 'linear', display: true, position: 'right', grid: {drawOnChartArea: false}, title: {display:true, text:'%'} },
            y_lux: { type: 'linear', display: false }, // ซ่อนแกนเลข Lux
            y_pres: { type: 'linear', display: false } // ซ่อนแกนเลข Pressure
        }
    }
});

// --- 🧠 ระบบ AI วิเคราะห์ ---
function analyzeWeather(latest, trendPressure) {
    let forecast = "";
    let action = "";
    let icon = "😐";
    let themeClass = "bg-secondary";

    if (latest.rain > 0.5) {
        forecast = "ฝนกำลังตกตอนนี้! 🌧️";
        action = "ขับรถระวังถนนลื่น | เก็บผ้าเข้าบ้านด่วน";
        themeClass = "bg-gradient-rain";
        icon = "🌧️";
    } else if (trendPressure < -1.0) {
        forecast = "ความกดอากาศต่ำลง อีก 2-3 ชม. ฝนอาจตก ☁️";
        action = "ควรพกร่มก่อนออกจากบ้าน | อย่าเพิ่งล้างรถ";
        themeClass = "bg-secondary";
        icon = "🌂";
    } else if (latest.uv > 6 || latest.light > 50000) {
        forecast = "แดดแรงมาก! ฟ้าโปร่ง ☀️";
        action = "ทาครีมกันแดด | ใส่แว่นกันแดด | เลี่ยงที่แจ้ง";
        themeClass = "bg-gradient-advice";
        icon = "🥵";
    } else if (latest.temperature > 35) {
        forecast = "อากาศร้อนจัด 🔥";
        action = "ดื่มน้ำบ่อยๆ | ระวังฮีทสโตรก";
        themeClass = "bg-gradient-advice";
        icon = "🌡️";
    } else {
        forecast = "อากาศปกติ สบายๆ 🍃";
        action = "เหมาะกับการออกกำลังกายกลางแจ้ง";
        themeClass = "bg-gradient-safe"; 
        icon = "😊";
    }

    document.getElementById('forecast-msg').innerText = forecast;
    document.getElementById('action-msg').innerText = "💡 แนะนำ: " + action;
    document.getElementById('advice-icon').innerText = icon;
    
    const card = document.getElementById('advice-card');
    card.className = `card-weather text-white p-4 ${themeClass}`;
}

// --- 📥 Export CSV ---
function exportCSV() {
    if (globalData.length === 0) { alert("ไม่มีข้อมูลให้ Export"); return; }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Time,Temperature,Humidity,Pressure,Light,Rain,Wind,UV\n"; // เพิ่ม Light

    globalData.forEach(row => {
        const dateObj = new Date(row.created_at);
        csvContent += `${dateObj.toLocaleDateString('th-TH')},${dateObj.toLocaleTimeString('th-TH')},${row.temperature},${row.humidity},${row.pressure},${row.light},${row.rain},${row.wind_speed},${row.uv}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "weather_data.csv");
    document.body.appendChild(link);
    link.click();
}

// --- 🔄 Fetch Data ---
async function fetchData() {
    const dateInput = document.getElementById('datePicker').value;
    const startDate = new Date(dateInput); 
    startDate.setHours(0,0,0);
    const endDate = new Date(dateInput); 
    endDate.setHours(23,59,59);

    const { data, error } = await _supabase
        .from('weather_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true }) 

    if (data && data.length > 0) {
        globalData = data; 
        const latest = data[data.length - 1]; 
        
        const oneHourAgoIndex = Math.max(0, data.length - 60);
        const trendP = latest.pressure - data[oneHourAgoIndex].pressure;

        // อัปเดตตัวเลขการ์ด
        document.getElementById('temp').innerText = latest.temperature.toFixed(1);
        document.getElementById('hum').innerText = latest.humidity.toFixed(0);
        document.getElementById('wind').innerText = latest.wind_speed.toFixed(1);
        document.getElementById('rain').innerText = latest.rain.toFixed(1);
        document.getElementById('uv').innerText = latest.uv.toFixed(1);
        document.getElementById('light').innerText = latest.light.toFixed(0); // ✅ เพิ่ม Light
        document.getElementById('pres').innerText = latest.pressure.toFixed(0);
        document.getElementById('last-update').innerText = "ข้อมูลล่าสุด: " + new Date(latest.created_at).toLocaleTimeString('th-TH');

        analyzeWeather(latest, trendP);

        // อัปเดตกราฟ
        weatherChart.data.labels = data.map(d => new Date(d.created_at).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'}));
        weatherChart.data.datasets[0].data = data.map(d => d.temperature);
        weatherChart.data.datasets[1].data = data.map(d => d.humidity);
        weatherChart.data.datasets[2].data = data.map(d => d.wind_speed);
        weatherChart.data.datasets[3].data = data.map(d => d.rain);
        weatherChart.data.datasets[4].data = data.map(d => d.uv);
        weatherChart.data.datasets[5].data = data.map(d => d.light);    // ✅ เพิ่ม Light
        weatherChart.data.datasets[6].data = data.map(d => d.pressure);
        weatherChart.update();
    } else {
        document.getElementById('temp').innerText = "--";
        globalData = [];
        weatherChart.data.labels = [];
        weatherChart.data.datasets.forEach(ds => ds.data = []);
        weatherChart.update();
    }
}

// Init
fetchData();
setInterval(() => {
    const today = new Date().toISOString().split('T')[0];
    if(document.getElementById('datePicker').value === today) {
        fetchData();
    }
}, 10000);
