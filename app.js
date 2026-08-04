// ------ разпознаване на международни автобусни направления ------
// Скрейпнатите данни често нямат intl флаг → познаваме по името на града.
var __INTL_RE = /(истанб|istanbul|одрин|edirne|бурса|bursa|измир|izmir|анкара|ankara|анталия|antalya|солун|thessalon|атина|athen|скопие|skopje|битоля|bitola|охрид|ohrid|белград|belgrad|ниш|\bnis\b|нови сад|novi sad|букурещ|bucharest|bucure|русе-букурещ|крайова|craiova|тимишоара|timis|загреб|zagreb|любляна|ljubljan|сараево|saraje|подгорица|podgoric|тирана|tiran|прищина|pristin|priştin|виена|vienna|wien|мюнхен|munich|münchen|берлин|berlin|хамбург|hamburg|кьолн|cologne|köln|щутгарт|stuttgart|франкфурт|frankfurt|дюселдорф|dусseldorf|прага|prague|praha|братислава|bratislav|будапеща|budapest|варшава|warsaw|warszaw|краков|krakow|милано|milan|рим|\broma\b|\brome\b|венеция|venice|venezia|болоня|bologna|торино|turin|неапол|naples|napoli|флоренция|florence|firenze|барселона|barcelona|мадрид|madrid|валенсия|valencia|лисабон|lisbon|порто|porto|париж|paris|лион|lyon|марсилия|marseille|брюксел|brussels|амстердам|amsterdam|ротердам|rotterdam|цюрих|zurich|zürich|женева|geneva|базел|basel|берн|\bbern\b|лондон|london|стокхолм|stockholm|осло|\boslo\b|копенхаген|copenhagen|хелзинки|helsinki|кишинев|chisinau|chişin|киев|kyiv|kiev|одеса|odesa|odessa|москва|moscow)/i;
function isIntlBus(o){
  if(!o) return false;
  if(o.intl === true) return true;
  var txt = [o.origin, o.from, o.name, o.to, o.operator].filter(Boolean).join(' ');
  return __INTL_RE.test(txt);
}

// ═══════════════════════════════════════════════
// ДИСТАНЦИОНЕН КЛЮЧ + ЦИКЪЛ 10 МИН ТЕСТ / 100 МИН ЗАКЛЮЧЕНО
// (само в тестовото копие)
// ═══════════════════════════════════════════════
(function(){
  var CHECK_MS = 60 * 1000;           // проверка на access.json (ръчен превключвател)
  var ACTIVE_MS = 10 * 60 * 1000;     // активен прозорец: 10 мин
  var CYCLE_MS = 110 * 60 * 1000;     // пълен цикъл: 10 мин достъп + 100 мин заключено
  var CONTACT = 'свържете се с мен за платена версия на 0889638230';

  function block(msg){
    if(document.getElementById('locked')) return;
    var d = document.createElement('div');
    d.id = 'locked';
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;'
      + 'align-items:center;justify-content:center;padding:28px;text-align:center;'
      + 'background:#070c14;color:#e8eef7;font:600 17px/1.6 system-ui,sans-serif';
    d.innerHTML = '<div><div style="font-size:44px;margin-bottom:14px">🔒</div>'
      + '<div style="font-weight:800;font-size:19px;margin-bottom:8px">Достъпът е спрян</div>'
      + '<div style="opacity:.75;font-size:15px">' + (msg || 'Тестовият период приключи.') + '</div></div>';
    document.body.appendChild(d);
    try{
      if('caches' in window) caches.keys().then(function(k){ k.forEach(function(n){ caches.delete(n); }); });
      if(navigator.serviceWorker) navigator.serviceWorker.getRegistrations()
        .then(function(rs){ rs.forEach(function(r){ r.unregister(); }); });
    }catch(e){}
  }

  function unlock(){
    var d = document.getElementById('locked');
    if(d) d.remove();
  }

  function cycleState(){
    var pos = Date.now() % CYCLE_MS;
    if(pos < ACTIVE_MS){
      return { locked:false };
    }
    var remainMs = CYCLE_MS - pos;
    var remainMin = Math.ceil(remainMs / 60000);
    return {
      locked:true,
      msg:'Временният тестов достъп приключи. Изчакайте около ' + remainMin
        + ' мин. за следващия тестов прозорец, или ' + CONTACT
    };
  }

  var manualOff = false;

  function check(){
    fetch('access.json?v=' + Date.now(), { cache:'no-store' })
      .then(function(r){ return r.json(); })
      .then(function(a){
        if(a && a.enabled === false){
          manualOff = true;
          block(a.message);
          return;
        }
        manualOff = false;
        applyCycle();
      })
      .catch(function(){ applyCycle(); });
  }

  function applyCycle(){
    if(manualOff) return;
    var s = cycleState();
    if(s.locked) block(s.msg);
    else unlock();
  }

  check();
  setInterval(check, CHECK_MS);
  setInterval(applyCycle, 15 * 1000); // по-чест локален превключвател за прозореца 10/100
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) check(); });
})();
