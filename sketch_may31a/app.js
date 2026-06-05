// ==========================================
// LOGIC ĐIỀU KHIỂN HỆ THỐNG CẢNH BÁO XÓI MÒN
// ==========================================

// Global state variables
let port = null;
let reader = null;
let readableStreamClosed = null;
let isConnected = false;
let historyLog = [];
let chart = null;

// Web Audio State
let audioCtx = null;
let sirenOsc = null;
let sirenGain = null;
let sirenInterval = null;
let isMuted = true; // Mặc định tắt tiếng để tránh làm phiền
let currentAlertLevel = 1;

// UI Elements
const btnConnect = document.getElementById('btnConnect');
const baudrateSelect = document.getElementById('baudrateSelect');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const btnMute = document.getElementById('btnMute');
const muteIcon = btnMute.querySelector('i');
const alertBanner = document.getElementById('alertBanner');
const alertLevelText = document.getElementById('alertLevelText');
const alertDescText = document.getElementById('alertDescText');
const alertBadgeIcon = document.getElementById('alertBadgeIcon');
const btnTheme = document.getElementById('btnTheme');
const themeIcon = btnTheme.querySelector('i');

// Sensors UI Elements
const soilPercentText = document.getElementById('soilPercent');
const soilValText = document.getElementById('soilVal');
const soilGaugeFill = document.getElementById('soilGaugeFill');
const rainStatusText = document.getElementById('rainStatus');
const rainValueText = document.getElementById('rainValue');
const rainProgressBar = document.getElementById('rainProgressBar');
const rainIcon = document.getElementById('rainIcon');
const tiltCountText = document.getElementById('tiltCount');
const tiltStatusText = document.getElementById('tiltStatus');

// Terrain Simulation Elements
const hillContainer = document.getElementById('hillContainer');
const slopeElement = document.getElementById('slopeElement');
const slopeGrassElement = document.getElementById('slopeGrassElement');
const rainOverlay = document.getElementById('rainOverlay');
const treeElements = document.querySelectorAll('.tree');

// Log Elements
const logTableBody = document.getElementById('logTableBody');
const btnExport = document.getElementById('btnExport');

// 1. INITIALIZATION ON PAGE LOAD
document.addEventListener('DOMContentLoaded', () => {
  initChart();
  initRainDrops();
  
  // Set up event listeners
  btnConnect.addEventListener('click', toggleConnection);
  btnMute.addEventListener('click', toggleMute);
  btnExport.addEventListener('click', exportToCSV);
  btnTheme.addEventListener('click', toggleTheme);
  
  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    themeIcon.className = 'fas fa-moon';
    btnTheme.title = "Chuyển sang chế độ Tối";
    setTimeout(updateChartTheme, 100);
  }
  
  // Check browser support for Web Serial
  if (!('serial' in navigator)) {
    statusText.textContent = "Chưa được hỗ trợ (Hãy dùng Chrome/Edge!)";
    statusText.style.color = '#ef4444';
    statusDot.className = 'status-dot disconnected';
    btnConnect.disabled = true;
    btnConnect.style.opacity = '0.5';
    btnConnect.style.cursor = 'not-allowed';
    alert("Trình duyệt của bạn không hỗ trợ Web Serial API. Vui lòng sử dụng Google Chrome hoặc Microsoft Edge.");
  }
});

// 2. WEB AUDIO API - SIREN GENERATOR
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function startSiren(level) {
  initAudio();
  if (isMuted || !audioCtx) return;
  if (sirenOsc) return; // Còi đang chạy rồi

  sirenOsc = audioCtx.createOscillator();
  sirenGain = audioCtx.createGain();

  sirenOsc.type = 'sawtooth';
  sirenOsc.frequency.setValueAtTime(level === 4 ? 800 : 500, audioCtx.currentTime);

  sirenGain.gain.setValueAtTime(0, audioCtx.currentTime);
  sirenGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);

  sirenOsc.connect(sirenGain);
  sirenGain.connect(audioCtx.destination);
  sirenOsc.start();

  // Hiệu ứng tần số quét (Còi hú cảnh sát)
  let high = true;
  sirenInterval = setInterval(() => {
    if (!audioCtx || !sirenOsc) return;
    const now = audioCtx.currentTime;
    if (level === 4) {
      // Hú dồn dập (Cấp 4): quét 800Hz - 1200Hz
      sirenOsc.frequency.exponentialRampToValueAtTime(high ? 1200 : 800, now + 0.2);
    } else {
      // Kêu ngắt quãng chậm hơn (Cấp 3): quét 500Hz - 650Hz
      sirenOsc.frequency.linearRampToValueAtTime(high ? 650 : 500, now + 0.4);
    }
    high = !high;
  }, level === 4 ? 250 : 500);
}

function stopSiren() {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  if (sirenOsc) {
    try {
      sirenOsc.stop();
      sirenOsc.disconnect();
    } catch (e) {}
    sirenOsc = null;
  }
  if (sirenGain) {
    try {
      sirenGain.disconnect();
    } catch (e) {}
    sirenGain = null;
  }
}

function toggleMute() {
  isMuted = !isMuted;
  if (isMuted) {
    muteIcon.className = 'fas fa-volume-mute';
    btnMute.classList.add('muted');
    btnMute.title = "Bật âm thanh báo động";
    stopSiren();
  } else {
    muteIcon.className = 'fas fa-volume-up';
    btnMute.classList.remove('muted');
    btnMute.title = "Tắt âm thanh báo động";
    // Nếu cấp độ hiện tại là 3 hoặc 4 thì kích hoạt còi ngay
    if (currentAlertLevel >= 3) {
      startSiren(currentAlertLevel);
    }
  }
}

// 3. WEB SERIAL API CONNECTION
async function toggleConnection() {
  if (isConnected) {
    await disconnectFromSerial();
  } else {
    await connectToSerial();
  }
}

async function connectToSerial() {
  try {
    statusText.textContent = "Đang kết nối...";
    statusDot.className = 'status-dot';
    
    // Yêu cầu cổng COM từ người dùng
    port = await navigator.serial.requestPort();
    
    const baudRateValue = parseInt(baudrateSelect.value);
    await port.open({ baudRate: baudRateValue });
    
    isConnected = true;
    btnConnect.textContent = "Ngắt kết nối";
    btnConnect.classList.add('btn-disconnect');
    statusText.textContent = "Đã kết nối";
    statusDot.className = 'status-dot connected';
    baudrateSelect.disabled = true;
    
    // Đọc luồng dữ liệu
    const textDecoder = new TextDecoderStream();
    readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable.getReader();
    
    readSerialData();
  } catch (error) {
    console.error("Lỗi kết nối Serial:", error);
    statusText.textContent = "Lỗi kết nối";
    statusDot.className = 'status-dot disconnected';
    baudrateSelect.disabled = false;
    alert("Không thể kết nối cổng Serial. Vui lòng thử lại!");
  }
}

async function disconnectFromSerial() {
  try {
    statusText.textContent = "Đang ngắt kết nối...";
    
    stopSiren();
    
    if (reader) {
      await reader.cancel();
      await readableStreamClosed.catch(() => {});
      reader = null;
    }
    
    if (port) {
      await port.close();
      port = null;
    }
    
    isConnected = false;
    btnConnect.textContent = "Kết nối Arduino";
    btnConnect.classList.remove('btn-disconnect');
    statusText.textContent = "Chưa kết nối";
    statusDot.className = 'status-dot disconnected';
    baudrateSelect.disabled = false;
  } catch (error) {
    console.error("Lỗi khi ngắt kết nối:", error);
  }
}

async function readSerialData() {
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += value;
      let lines = buffer.split('\n');
      buffer = lines.pop(); // Giữ lại dòng chưa hoàn chỉnh ở cuối
      
      for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine.startsWith("[JSON_DATA]")) {
          const jsonString = cleanLine.substring(11);
          parseAndDisplayData(jsonString);
        }
      }
    }
  } catch (error) {
    console.error("Lỗi trong vòng lặp đọc dữ liệu:", error);
    // Nếu mất kết nối đột ngột
    if (isConnected) {
      disconnectFromSerial();
    }
  }
}

// 4. PARSE & PROCESS DATA
function parseAndDisplayData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    
    // Cập nhật các biến giá trị cảm biến
    const soil = data.soil;
    const soilVal = data.soilVal;
    const rain = data.rain;
    const rainStatus = data.rainStatus;
    const tilt = data.tilt;
    const tiltStatus = data.tiltStatus;
    const level = data.level;
    
    const timestamp = new Date().toLocaleTimeString();

    // 1. Cập nhật UI cảm biến độ ẩm đất
    soilPercentText.textContent = `${soil}%`;
    soilValText.textContent = soilVal;
    // Cập nhật vòng quay gauge
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (soil / 100) * circumference;
    soilGaugeFill.style.strokeDashoffset = offset;
    
    // Đổi màu gauge dựa theo độ ẩm
    if (soil > 80) {
      soilGaugeFill.style.stroke = 'var(--color-level-4)';
    } else if (soil > 60) {
      soilGaugeFill.style.stroke = 'var(--color-level-2)';
    } else {
      soilGaugeFill.style.stroke = 'var(--primary)';
    }

    // 2. Cập nhật UI cảm biến mưa
    rainStatusText.textContent = rainStatus;
    rainValueText.textContent = rain;
    // Ánh xạ giá trị mưa thô 1023 (Khô) - 0 (Ướt đẫm) sang thanh phần trăm 0% - 100%
    const rainPercent = Math.max(0, Math.min(100, Math.round(100 - (rain / 1023) * 100)));
    rainProgressBar.style.width = `${rainPercent}%`;
    
    // Biểu tượng thời tiết tương ứng
    if (rainStatus === "MUA LON") {
      rainIcon.className = 'fas fa-cloud-showers-heavy rain-icon-large';
      rainIcon.style.color = '#38bdf8';
    } else if (rainStatus === "MUA VUA") {
      rainIcon.className = 'fas fa-cloud-rain rain-icon-large';
      rainIcon.style.color = '#60a5fa';
    } else if (rainStatus === "MUA NHE") {
      rainIcon.className = 'fas fa-cloud-sun-rain rain-icon-large';
      rainIcon.style.color = '#93c5fd';
    } else {
      rainIcon.className = 'fas fa-sun rain-icon-large';
      rainIcon.style.color = '#f59e0b';
    }

    // 3. Cập nhật UI cảm biến rung lắc
    tiltCountText.textContent = tilt;
    tiltStatusText.textContent = tiltStatus;
    
    // Gán class cảnh báo rung lắc
    if (tiltStatus === "CO DAU HIEU DICH CHUYEN DAT") {
      tiltStatusText.className = 'tilt-status-badge danger';
    } else if (tiltStatus === "CO RUNG LAC") {
      tiltStatusText.className = 'tilt-status-badge warning';
    } else {
      tiltStatusText.className = 'tilt-status-badge';
    }

    // 4. Cập nhật Cấp độ cảnh báo của hệ thống
    updateAlertSystem(level, rainStatus, soil, tilt);

    // 5. Cập nhật Đồi dốc mô phỏng (Simulation Visualizer)
    updateSimulation(level, rainStatus, soil, tilt);

    // 6. Cập nhật Đồ thị thời gian thực
    updateChart(timestamp, soil, rainPercent, tilt);

    // 7. Thêm dòng log vào bảng dữ liệu
    addLogToTable(timestamp, soil, soilVal, rain, rainStatus, tilt, tiltStatus, level);
    
    // Lưu lịch sử để xuất file
    historyLog.unshift({
      time: timestamp,
      soil: soil,
      soilVal: soilVal,
      rain: rain,
      rainStatus: rainStatus,
      tilt: tilt,
      tiltStatus: tiltStatus,
      level: level
    });
    
    // Giới hạn lịch sử lưu tối đa 500 dòng
    if (historyLog.length > 500) {
      historyLog.pop();
    }

  } catch (error) {
    console.error("Lỗi khi phân tích dữ liệu JSON nhận được:", error);
  }
}

// 5. UPDATE WARNING LEVELS & BANNER
function updateAlertSystem(level, rainStatus, soil, tilt) {
  currentAlertLevel = level;
  
  // Xóa hết class cũ
  alertBanner.className = 'alert-banner';
  
  // Cập nhật âm thanh & thông báo tương ứng
  stopSiren();
  
  switch(level) {
    case 1:
      alertBanner.classList.add('level-1');
      alertLevelText.textContent = "Cấp 1 - AN TOÀN";
      alertDescText.textContent = "Các thông số đất đai và lượng mưa ở mức bình thường. Không có nguy cơ xảy ra sạt lở hoặc xói mòn.";
      alertBadgeIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
      break;
    case 2:
      alertBanner.classList.add('level-2');
      alertLevelText.textContent = "Cấp 2 - CẦN THEO DÕI";
      alertDescText.textContent = "Độ ẩm đất tăng hoặc bắt đầu có mưa/rung lắc nhẹ. Hệ thống tự động theo dõi sát sao.";
      alertBadgeIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    case 3:
      alertBanner.classList.add('level-3');
      alertLevelText.textContent = "Cấp 3 - NGUY CƠ XÓI MÒN CAO";
      alertDescText.textContent = "Mưa lớn kéo dài và độ ẩm đất đã vượt mức an toàn (>80%). Nguy cơ xói mòn rửa trôi đất bề mặt rất lớn.";
      alertBadgeIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
      // Kích hoạt còi báo động chậm nếu không bị tắt tiếng
      startSiren(3);
      break;
    case 4:
      alertBanner.classList.add('level-4');
      alertLevelText.textContent = "CẤP 4 - NGUY CƠ SẠT LỞ RẤT CAO";
      alertDescText.textContent = "CẢNH BÁO NGUY HIỂM! Rung lắc dồn dập, đất bị bão hòa nước cực độ. Đất dốc có thể sạt trượt bất cứ lúc nào! Yêu cầu sơ tán.";
      alertBadgeIcon.innerHTML = '<i class="fas fa-radiation"></i>';
      // Kích hoạt còi hú dồn dập nếu không bị tắt tiếng
      startSiren(4);
      break;
    default:
      alertBanner.classList.add('level-1');
      alertLevelText.textContent = "Đang nhận dữ liệu...";
      alertDescText.textContent = "Vui lòng chờ thiết bị phản hồi dữ liệu.";
      alertBadgeIcon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
}

// 6. 2D SLOPE VISUALIZER SIMULATION
function initRainDrops() {
  rainOverlay.innerHTML = '';
  // Tạo sẵn 40 hạt mưa ẩn dưới dạng cấu trúc DOM
  for (let i = 0; i < 40; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.top = `${Math.random() * -50}px`;
    drop.style.animationDelay = `${Math.random() * 1.5}s`;
    drop.style.animationDuration = `${0.4 + Math.random() * 0.4}s`;
    rainOverlay.appendChild(drop);
  }
}

function updateSimulation(level, rainStatus, soil, tilt) {
  // 1. Quản lý mưa rơi mô phỏng
  rainOverlay.className = 'rain-overlay';
  if (rainStatus === "MUA LON") {
    rainOverlay.classList.add('active-heavy');
  } else if (rainStatus === "MUA VUA") {
    rainOverlay.classList.add('active-medium');
  } else if (rainStatus === "MUA NHE") {
    rainOverlay.classList.add('active-light');
  }
  
  // 2. Trạng thái bùn đất của đồi dốc (Ẩm ướt/Đổi màu)
  slopeElement.className = 'slope';
  slopeGrassElement.className = 'slope-grass';
  
  if (level === 4) {
    slopeElement.classList.add('eroded');
    slopeGrassElement.classList.add('eroded');
  } else if (soil > 60) {
    slopeElement.classList.add('wet');
  }

  // 3. Rung lắc đồi dốc khi có dịch chuyển (Rung động đất đá)
  if (tilt > 20) {
    hillContainer.classList.add('shake');
  } else {
    hillContainer.classList.remove('shake');
  }

  // 4. Trạng thái của cây xanh trên sườn dốc
  treeElements.forEach(tree => {
    tree.className = 'tree';
    // Đánh chỉ số lớp ngẫu nhiên dựa trên các lớp vị trí cây có sẵn
    const classList = tree.classList;
    
    if (level === 3) {
      tree.classList.add('tilt'); // Cây nghiêng khi có xói mòn
    } else if (level === 4) {
      tree.classList.add('collapsed'); // Cây bật gốc đổ rạp khi sạt lở
    }
  });
}

// 7. CHART.JS REAL-TIME GRAPH
function initChart() {
  const ctx = document.getElementById('historyChart').getContext('2d');
  
  // Gradient màu nền cho các nét vẽ đồ thị
  const blueGradient = ctx.createLinearGradient(0, 0, 0, 300);
  blueGradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
  blueGradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
  
  const greenGradient = ctx.createLinearGradient(0, 0, 0, 300);
  greenGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
  greenGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  const redGradient = ctx.createLinearGradient(0, 0, 0, 300);
  redGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
  redGradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Độ ẩm đất (%)',
          data: [],
          borderColor: '#10b981',
          backgroundColor: greenGradient,
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#10b981',
          pointRadius: 2,
          yAxisID: 'y'
        },
        {
          label: 'Cường độ mưa (%)',
          data: [],
          borderColor: '#38bdf8',
          backgroundColor: blueGradient,
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#38bdf8',
          pointRadius: 2,
          yAxisID: 'y'
        },
        {
          label: 'Vibration/Rung lắc (5s)',
          data: [],
          borderColor: '#ef4444',
          backgroundColor: redGradient,
          fill: true,
          tension: 0.1,
          borderWidth: 2,
          pointBackgroundColor: '#ef4444',
          pointRadius: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: {
              family: 'Outfit',
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Outfit', size: 13, weight: 'bold' },
          bodyFont: { family: 'Outfit', size: 12 },
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#64748b', font: { family: 'Outfit' } }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          min: 0,
          max: 100,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { 
            color: '#94a3b8',
            font: { family: 'Outfit' },
            callback: function(value) { return value + '%'; }
          },
          title: {
            display: true,
            text: 'Độ ẩm / Cường độ mưa',
            color: '#94a3b8',
            font: { family: 'Outfit', size: 11, weight: 'bold' }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 0,
          suggestedMax: 100,
          grid: { drawOnChartArea: false },
          ticks: { color: '#ef4444', font: { family: 'Outfit' } },
          title: {
            display: true,
            text: 'Tần suất rung lắc',
            color: '#ef4444',
            font: { family: 'Outfit', size: 11, weight: 'bold' }
          }
        }
      }
    }
  });
}

function updateChart(time, soil, rainPercent, tilt) {
  if (!chart) return;
  
  // Đẩy nhãn và dữ liệu vào
  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(soil);
  chart.data.datasets[1].data.push(rainPercent);
  chart.data.datasets[2].data.push(tilt);
  
  // Giới hạn tối đa hiển thị 15 điểm dữ liệu gần nhất để tránh rối
  if (chart.data.labels.length > 15) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
    chart.data.datasets[1].data.shift();
    chart.data.datasets[2].data.shift();
  }
  
  chart.update();
}

// 8. LOG TABLE UPDATE
function addLogToTable(time, soil, soilVal, rain, rainStatus, tilt, tiltStatus, level) {
  const newRow = document.createElement('tr');
  
  let levelClass = 'level-1';
  let levelName = 'Cấp 1 - An toàn';
  if (level === 2) { levelClass = 'level-2'; levelName = 'Cấp 2 - Theo dõi'; }
  else if (level === 3) { levelClass = 'level-3'; levelName = 'Cấp 3 - Xói mòn'; }
  else if (level === 4) { levelClass = 'level-4'; levelName = 'Cấp 4 - Sạt lở'; }

  newRow.innerHTML = `
    <td><strong>${time}</strong></td>
    <td>${soil}% <span style="font-size: 0.75rem; color: var(--text-muted)">(${soilVal})</span></td>
    <td>${rainStatus} <span style="font-size: 0.75rem; color: var(--text-muted)">(${rain})</span></td>
    <td>${tilt} <span style="font-size: 0.75rem; color: var(--text-muted)">(${tiltStatus})</span></td>
    <td><span class="log-level ${levelClass}">${levelName}</span></td>
  `;
  
  logTableBody.insertBefore(newRow, logTableBody.firstChild);
  
  // Giới hạn hiển thị 30 hàng log mới nhất trên bảng UI
  if (logTableBody.children.length > 30) {
    logTableBody.removeChild(logTableBody.lastChild);
  }
}

// 9. EXPORT LOG TO CSV FILE
function exportToCSV() {
  if (historyLog.length === 0) {
    alert("Hệ thống chưa ghi nhận dòng dữ liệu nào! Hãy kết nối Arduino và chờ nhận gói tin.");
    return;
  }
  
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Thêm BOM hỗ trợ tiếng Việt trên Excel
  csvContent += "Thời gian,Độ ẩm đất (%),Giá trị cảm biến đất,Giá trị cảm biến mưa,Trạng thái mưa,Số lần rung lắc (5s),Trạng thái địa hình,Cấp độ cảnh báo\n";
  
  historyLog.forEach(row => {
    let levelStr = "Cấp 1 - An toàn";
    if (row.level === 2) levelStr = "Cấp 2 - Cần theo dõi";
    else if (row.level === 3) levelStr = "Cấp 3 - Cảnh báo xói mòn";
    else if (row.level === 4) levelStr = "Cấp 4 - Nguy hiểm sạt lở";

    csvContent += `"${row.time}","${row.soil}","${row.soilVal}","${row.rain}","${row.rainStatus}","${row.tilt}","${row.tiltStatus}","${levelStr}"\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Bao_cao_he_thong_canh_bao_xoi_mon_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 10. LIGHT / DARK THEME TOGGLE
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  if (isLight) {
    themeIcon.className = 'fas fa-moon';
    btnTheme.title = "Chuyển sang chế độ Tối";
    localStorage.setItem('theme', 'light');
  } else {
    themeIcon.className = 'fas fa-sun';
    btnTheme.title = "Chuyển sang chế độ Sáng";
    localStorage.setItem('theme', 'dark');
  }
  updateChartTheme();
}

function updateChartTheme() {
  if (!chart) return;
  const isLight = document.body.classList.contains('light-mode');
  const textColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.05)';
  
  chart.options.scales.x.grid.color = gridColor;
  chart.options.scales.y.grid.color = gridColor;
  chart.options.scales.y.ticks.color = textColor;
  chart.options.scales.y.title.color = textColor;
  chart.options.plugins.legend.labels.color = textColor;
  chart.update();
}
