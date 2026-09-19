
  const WORKER_URL = "https://powershare-calculator.naveenkumarsingh112211.workers.dev/";

  const myPowerEl = document.getElementById('myPower');
  const myUnitEl = document.getElementById('myUnit');
  const leaguePowerEl = document.getElementById('leaguePower');
  const leagueUnitEl = document.getElementById('leagueUnit');
  const blockRewardEl = document.getElementById('blockReward');
  const blockTimePresetEl = document.getElementById('blockTimePreset');
  const blockTimeCustomWrap = document.getElementById('blockTimeCustomWrap');
  const blockTimeCustomMinEl = document.getElementById('blockTimeCustomMin');
  const blockTimeCustomSecEl = document.getElementById('blockTimeCustomSec');

  blockTimePresetEl.addEventListener('change', () => {
    blockTimeCustomWrap.style.display = blockTimePresetEl.value === '__custom__' ? 'flex' : 'none';
  });

  function getBlockMinutes() {
    if (blockTimePresetEl.value === '__custom__') {
      const m = parseFloat(blockTimeCustomMinEl.value) || 0;
      const s = parseFloat(blockTimeCustomSecEl.value) || 0;
      return m + s / 60;
    }
    return parseFloat(blockTimePresetEl.value);
  }
  const coinLabelEl = document.getElementById('coinLabel');
  const coinOtherWrap = document.getElementById('coinOtherWrap');
  const coinOtherEl = document.getElementById('coinOther');

  coinLabelEl.addEventListener('change', () => {
    coinOtherWrap.style.display = coinLabelEl.value === '__other__' ? 'flex' : 'none';
  });

  function getCoinValue() {
    if (coinLabelEl.value === '__other__') return coinOtherEl.value.trim();
    return coinLabelEl.value;
  }

  const gaugeFill = document.getElementById('gaugeFill');
  const gaugePct = document.getElementById('gaugePct');
  const calcBtn = document.getElementById('calcBtn');
  const clearBtn = document.getElementById('clearBtn');
  const errorMsg = document.getElementById('errorMsg');
  const loadingNote = document.getElementById('loadingNote');
  const results = document.getElementById('results');
  const statusText = document.getElementById('statusText');
  const led = document.getElementById('led');

  const unitMultiplier = { gh: 1e9, th: 1e12, ph: 1e15, eh: 1e18, zh: 1e21, yh: 1e24 };

  function updateGauge() {
    const my = parseFloat(myPowerEl.value);
    const league = parseFloat(leaguePowerEl.value);
    if (!my || !league || league <= 0) {
      gaugeFill.style.width = '0%';
      gaugePct.textContent = 'Enter both values to see your share';
      return;
    }
    const myBase = my * unitMultiplier[myUnitEl.value];
    const leagueBase = league * unitMultiplier[leagueUnitEl.value];
    const pct = Math.min(100, (myBase / leagueBase) * 100);
    gaugeFill.style.width = pct.toFixed(4) + '%';
    gaugePct.innerHTML = `Your share: <strong>${pct < 0.01 ? '<0.01' : pct.toFixed(3)}%</strong> of this league's power`;
  }

  [myPowerEl, myUnitEl, leaguePowerEl, leagueUnitEl].forEach(el => {
    el.addEventListener('input', updateGauge);
    el.addEventListener('change', updateGauge);
  });

  function fmt(n) {
    if (n === 0) return '0';
    if (n < 0.00001) return n.toExponential(3);
    return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
  }

  async function callWorker(payload) {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }

  async function calculate() {
    errorMsg.style.display = 'none';
    results.style.display = 'none';

    const myPower = parseFloat(myPowerEl.value);
    const leaguePower = parseFloat(leaguePowerEl.value);
    const blockReward = parseFloat(blockRewardEl.value);
    const blockMinutes = getBlockMinutes() || 10;

    if (!myPower || !leaguePower || !blockReward || leaguePower <= 0) {
      errorMsg.textContent = 'Please fill in your power, league power, and block reward with valid numbers.';
      errorMsg.style.display = 'block';
      return;
    }

    if (WORKER_URL.includes('PASTE-YOUR')) {
      errorMsg.textContent = 'Calculator backend not connected yet — see setup guide.';
      errorMsg.style.display = 'block';
      return;
    }

    loadingNote.style.display = 'block';
    statusText.textContent = 'calculating…';
    led.classList.add('on');
    calcBtn.disabled = true;

    try {
      const data = await callWorker({
        myPower, myUnit: myUnitEl.value,
        leaguePower, leagueUnit: leagueUnitEl.value,
        blockReward, blockMinutes
      });

      const coin = getCoinValue();
      const suffix = coin ? ` ${coin}` : '';

      document.getElementById('resBlock').textContent = fmt(data.perBlock) + suffix;
      document.getElementById('resHour').textContent = fmt(data.perHour) + suffix;
      document.getElementById('resDay').textContent = fmt(data.perDay) + suffix;
      document.getElementById('resMonth').textContent = fmt(data.perMonth) + suffix;

      results.style.display = 'grid';
      statusText.textContent = 'done';
    } catch (err) {
      console.error(err);
      errorMsg.textContent = 'Could not reach the calculator right now. Please try again shortly.';
      errorMsg.style.display = 'block';
      statusText.textContent = 'error';
    } finally {
      loadingNote.style.display = 'none';
      led.classList.remove('on');
      calcBtn.disabled = false;
    }
  }

  calcBtn.addEventListener('click', calculate);

  clearBtn.addEventListener('click', () => {
    [myPowerEl, leaguePowerEl, blockRewardEl].forEach(el => el.value = '');
    coinLabelEl.value = '';
    coinOtherEl.value = '';
    coinOtherWrap.style.display = 'none';
    blockTimePresetEl.value = '10';
    blockTimeCustomMinEl.value = '';
    blockTimeCustomSecEl.value = '';
    blockTimeCustomWrap.style.display = 'none';
    updateGauge();
    results.style.display = 'none';
    errorMsg.style.display = 'none';
    statusText.textContent = 'ready';
  });

  // ---------- Tab switching ----------
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      statusText.textContent = 'ready';
      errorMsg.style.display = 'none';
      wiErrorMsg.style.display = 'none';
    });
  });

  // ---------- What-If tab ----------
  const wiMyPowerEl = document.getElementById('wiMyPower');
  const wiMyUnitEl = document.getElementById('wiMyUnit');
  const wiLeaguePowerEl = document.getElementById('wiLeaguePower');
  const wiLeagueUnitEl = document.getElementById('wiLeagueUnit');
  const wiAddPowerEl = document.getElementById('wiAddPower');
  const wiAddUnitEl = document.getElementById('wiAddUnit');
  const wiBlockRewardEl = document.getElementById('wiBlockReward');
  const wiBlockTimePresetEl = document.getElementById('wiBlockTimePreset');
  const wiBlockTimeCustomWrap = document.getElementById('wiBlockTimeCustomWrap');
  const wiBlockTimeCustomMinEl = document.getElementById('wiBlockTimeCustomMin');
  const wiBlockTimeCustomSecEl = document.getElementById('wiBlockTimeCustomSec');

  wiBlockTimePresetEl.addEventListener('change', () => {
    wiBlockTimeCustomWrap.style.display = wiBlockTimePresetEl.value === '__custom__' ? 'flex' : 'none';
  });

  function getWiBlockMinutes() {
    if (wiBlockTimePresetEl.value === '__custom__') {
      const m = parseFloat(wiBlockTimeCustomMinEl.value) || 0;
      const s = parseFloat(wiBlockTimeCustomSecEl.value) || 0;
      return m + s / 60;
    }
    return parseFloat(wiBlockTimePresetEl.value);
  }
  const wiCoinLabelEl = document.getElementById('wiCoinLabel');
  const wiCoinOtherWrap = document.getElementById('wiCoinOtherWrap');
  const wiCoinOtherEl = document.getElementById('wiCoinOther');

  wiCoinLabelEl.addEventListener('change', () => {
    wiCoinOtherWrap.style.display = wiCoinLabelEl.value === '__other__' ? 'flex' : 'none';
  });

  function getWiCoinValue() {
    if (wiCoinLabelEl.value === '__other__') return wiCoinOtherEl.value.trim();
    return wiCoinLabelEl.value;
  }
  const wiCalcBtn = document.getElementById('wiCalcBtn');
  const wiClearBtn = document.getElementById('wiClearBtn');
  const wiErrorMsg = document.getElementById('wiErrorMsg');
  const wiLoadingNote = document.getElementById('wiLoadingNote');
  const compareTable = document.getElementById('compareTable');

  function fmtPct(n) {
    if (n < 0.0001) return n.toExponential(2) + '%';
    return n.toFixed(4) + '%';
  }

  wiCalcBtn.addEventListener('click', async () => {
    wiErrorMsg.style.display = 'none';
    compareTable.style.display = 'none';

    const myPower = parseFloat(wiMyPowerEl.value);
    const leaguePower = parseFloat(wiLeaguePowerEl.value);
    const addPower = parseFloat(wiAddPowerEl.value);
    const blockReward = parseFloat(wiBlockRewardEl.value);
    const blockMinutes = getWiBlockMinutes() || 10;

    if (!myPower || !leaguePower || !addPower || !blockReward || leaguePower <= 0) {
      wiErrorMsg.textContent = 'Please fill in your current power, league power, power to add, and block reward.';
      wiErrorMsg.style.display = 'block';
      return;
    }

    if (WORKER_URL.includes('PASTE-YOUR')) {
      wiErrorMsg.textContent = 'Calculator backend not connected yet — see setup guide.';
      wiErrorMsg.style.display = 'block';
      return;
    }

    // Normalize everything to a common base (Gh/s) so mixed units combine correctly
    const myBaseGh = (myPower * unitMultiplier[wiMyUnitEl.value]) / unitMultiplier.gh;
    const leagueBaseGh = (leaguePower * unitMultiplier[wiLeagueUnitEl.value]) / unitMultiplier.gh;
    const addBaseGh = (addPower * unitMultiplier[wiAddUnitEl.value]) / unitMultiplier.gh;

    const newMyBaseGh = myBaseGh + addBaseGh;
    const newLeagueBaseGh = leagueBaseGh + addBaseGh; // adding power grows the league total too

    wiLoadingNote.style.display = 'block';
    wiCalcBtn.disabled = true;

    try {
      const [before, after] = await Promise.all([
        callWorker({ myPower: myBaseGh, myUnit: 'gh', leaguePower: leagueBaseGh, leagueUnit: 'gh', blockReward, blockMinutes }),
        callWorker({ myPower: newMyBaseGh, myUnit: 'gh', leaguePower: newLeagueBaseGh, leagueUnit: 'gh', blockReward, blockMinutes })
      ]);

      const coin = getWiCoinValue();
      const suffix = coin ? ` ${coin}` : '';

      document.getElementById('cmpShareBefore').textContent = fmtPct(before.share * 100);
      document.getElementById('cmpShareAfter').textContent = fmtPct(after.share * 100);
      document.getElementById('cmpDayBefore').textContent = fmt(before.perDay) + suffix;
      document.getElementById('cmpDayAfter').textContent = fmt(after.perDay) + suffix;
      document.getElementById('cmpMonthBefore').textContent = fmt(before.perMonth) + suffix;
      document.getElementById('cmpMonthAfter').textContent = fmt(after.perMonth) + suffix;

      const gainDay = after.perDay - before.perDay;
      const gainPct = before.perDay > 0 ? (gainDay / before.perDay) * 100 : 0;
      document.getElementById('cmpGainDay').textContent = '+' + fmt(gainDay) + suffix + ' / day';
      document.getElementById('cmpGainPct').textContent = '+' + gainPct.toFixed(2) + '% more per day';

      compareTable.style.display = 'block';
    } catch (err) {
      console.error(err);
      wiErrorMsg.textContent = 'Could not reach the calculator right now. Please try again shortly.';
      wiErrorMsg.style.display = 'block';
    } finally {
      wiLoadingNote.style.display = 'none';
      wiCalcBtn.disabled = false;
    }
  });

  wiClearBtn.addEventListener('click', () => {
    [wiMyPowerEl, wiLeaguePowerEl, wiAddPowerEl, wiBlockRewardEl].forEach(el => el.value = '');
    wiCoinLabelEl.value = 'DOGE';
    wiCoinOtherEl.value = '';
    wiCoinOtherWrap.style.display = 'none';
    wiBlockTimePresetEl.value = '10';
    wiBlockTimeCustomMinEl.value = '';
    wiBlockTimeCustomSecEl.value = '';
    wiBlockTimeCustomWrap.style.display = 'none';
    compareTable.style.display = 'none';
    wiErrorMsg.style.display = 'none';
  });

