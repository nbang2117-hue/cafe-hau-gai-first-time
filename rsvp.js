(() => {
  const key = 'soru-rsvp';
  const labels = { arcade: 'Chơi game', stroll: 'Đi lượn', home: 'Về nhà' };
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(key) || '{}') || {}; } catch (_) { /* URL also carries the appointment. */ }
  const params = new URLSearchParams(location.search);
  const validDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  const validTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
  const date = params.has('date') ? params.get('date') : saved.date;
  const time = params.has('time') ? params.get('time') : saved.time;
  const state = {
    date: validDate(date) ? date : '',
    time: validTime(time) ? time : '',
    activities: Array.isArray(saved.activities) ? saved.activities.filter((item) => Object.hasOwn(labels, item)) : []
  };
  const persist = () => { try { sessionStorage.setItem(key, JSON.stringify(state)); } catch (_) { /* Keep navigation working without storage. */ } };
  const carry = (path) => {
    const query = new URLSearchParams();
    if (state.date) query.set('date', state.date);
    if (state.time) query.set('time', state.time);
    return query.size ? `${path}?${query}` : path;
  };
  persist();
  document.querySelectorAll('a[href="activities.html"], a[href="date.html"]').forEach((link) => {
    link.href = carry(link.getAttribute('href'));
  });

  const dateInput = document.querySelector('#date');
  const timeInput = document.querySelector('#time');
  if (dateInput && timeInput) {
    dateInput.value = state.date;
    timeInput.value = state.time;
    dateInput.form.addEventListener('submit', () => {
      state.date = dateInput.value;
      state.time = timeInput.value;
      persist();
    });
  }

  const form = document.querySelector('#rsvp-form');
  if (!form) return;
  const summary = document.querySelector('#appointment-summary');
  const status = document.querySelector('#send-status');
  const button = document.querySelector('#send-answer');
  const complete = Boolean(state.date && state.time);
  const dateLabel = complete ? state.date.split('-').reverse().join('/') : '';
  summary.textContent = complete ? `Lịch hẹn của mình: ${dateLabel} lúc ${state.time} ♡` : 'Cậu quay lại chọn đủ ngày và giờ hẹn trước nhé.';
  const boxes = [...form.querySelectorAll('input[name="activities"]')];
  boxes.forEach((box) => {
    box.checked = state.activities.includes(box.value);
    box.addEventListener('change', () => {
      state.activities = boxes.filter((item) => item.checked).map((item) => item.value);
      persist();
    });
  });

  let sending = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    if (!complete) { status.textContent = 'Cậu bấm “Sửa ngày và giờ hẹn” để chọn lịch trước nhé.'; return; }
    const endpoint = window.RSVP_CONFIG?.endpoint || '';
    if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) {
      status.textContent = 'Chức năng gửi chưa được thiết lập. Câu trả lời chưa được gửi; cậu thử lại sau nhé.';
      return;
    }
    state.activities = boxes.filter((box) => box.checked).map((box) => box.value);
    persist();
    const payload = {
      _subject: 'Có câu trả lời cho lời mời đi Soru ♡',
      'Ngày hẹn': dateLabel,
      'Giờ hẹn': `${state.time} (giờ Việt Nam)`,
      'Hoạt động': state.activities.map((item) => labels[item]).join(', ') || 'Chưa chọn hoạt động thêm'
    };
    sending = true;
    button.disabled = true;
    button.textContent = 'Đang gửi…';
    status.textContent = 'Đang gửi câu trả lời của cậu…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Submission rejected');
      status.textContent = 'Đã gửi câu trả lời rồi nhé ♡';
      location.assign('lastpage.html');
    } catch (error) {
      status.textContent = error.name === 'AbortError'
        ? 'Chưa xác nhận được kết quả gửi vì kết nối quá lâu. Cậu kiểm tra mạng rồi thử lại nhé.'
        : 'Chưa gửi được câu trả lời. Các lựa chọn vẫn được giữ; cậu thử lại nhé.';
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.textContent = 'Gửi câu trả lời ♡';
    }
  });
})();
