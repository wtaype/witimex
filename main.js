import $ from 'jquery';
import '@fortawesome/fontawesome-free/css/all.min.css';
import moment from 'moment';
import 'moment/locale/es';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { adrm, Saludar, Notificacion, Mensaje } from '/wiquery.js';

// Configurar momento en español
moment.locale('es');

$(document).ready(function() {
  // Variable para mantener la instancia de FullCalendar
  let calendar = null;
  
  // Actualizar el saludo en el dashboard
  const updateGreeting = () => {
    const greeting = Saludar();
    $('#greeting').text(`${greeting} 😊`);
  };
  
  updateGreeting();
  // Actualizar el saludo cada hora
  setInterval(updateGreeting, 3600000);

  // Sidebar toggle
  $('#sidebarToggle').on('click', function() {
    $('.sidebar').toggleClass('collapsed');
    
    // Cambiar el ícono del botón según el estado
    if ($('.sidebar').hasClass('collapsed')) {
      $(this).find('i').removeClass('fa-angle-left').addClass('fa-angle-right');
    } else {
      $(this).find('i').removeClass('fa-angle-right').addClass('fa-angle-left');
    }
  });

  // Mobile menu toggle
  $('#mobileMenuToggle').on('click', function() {
    $('.sidebar').addClass('active');
    $('.sidebar-overlay').addClass('active');
  });

  // Cerrar sidebar al hacer clic en overlay
  $('.sidebar-overlay').on('click', function() {
    $('.sidebar').removeClass('active');
    $('.sidebar-overlay').removeClass('active');
  });

  // Funcionalidad de cambio de tema
  $('#themeToggle').on('click', function() {
    $('body').toggleClass('dark-mode');
    
    const isDarkMode = $('body').hasClass('dark-mode');
    if (isDarkMode) {
      $(this).find('i').removeClass('fa-moon').addClass('fa-sun');
      $(this).find('span').text('Modo claro');
      Mensaje('Modo oscuro activado', 'success');
    } else {
      $(this).find('i').removeClass('fa-sun').addClass('fa-moon');
      $(this).find('span').text('Modo oscuro');
      Mensaje('Modo claro activado', 'success');
    }
    
    // Si el calendario está inicializado, actualizar su apariencia
    if (calendar) {
      calendar.render();
    }
  });

  // Botón de actualizar
  $('#refreshBtn').on('click', function() {
    $(this).addClass('animate-spin');
    
    // Actualizar datos según la sección activa
    const activeSection = $('.nav-link.active').data('section');
    
    if (activeSection === 'dashboard') {
      updateDashboard(true);
      Mensaje('Dashboard actualizado', 'success');
    } else if (activeSection === 'timezone') {
      updateTimezones();
      Mensaje('Zonas horarias actualizadas', 'success');
    } else if (activeSection === 'calendar' && calendar) {
      calendar.refetchEvents();
      Mensaje('Calendario actualizado', 'success');
    }
    
    // Quitar animación después de un tiempo
    setTimeout(() => {
      $(this).removeClass('animate-spin');
    }, 1000);
  });

  // Botón de ayuda
  $('#helpBtn').on('click', function() {
    const activeSection = $('.nav-link.active').data('section');
    let helpMessage = '';
    
    switch (activeSection) {
      case 'dashboard':
        helpMessage = 'El Dashboard muestra información actual del tiempo como la hora, fecha, día del año, etc.';
        break;
      case 'calculator':
        helpMessage = 'La Calculadora de Tiempo te permite calcular diferencias entre fechas y tu edad exacta.';
        break;
      case 'converter':
        helpMessage = 'El Conversor te permite cambiar unidades de tiempo y convertir entre timestamps Unix y fechas.';
        break;
      case 'timezone':
        helpMessage = 'Zonas Horarias muestra la hora actual en diferentes lugares del mundo.';
        break;
      case 'calendar':
        helpMessage = 'El Calendario te permite ver y organizar eventos. Haz clic en un día para añadir un evento.';
        break;
      case 'timer':
        helpMessage = 'El Temporizador cuenta hacia atrás desde un tiempo establecido, y el Cronómetro mide el tiempo transcurrido.';
        break;
      default:
        helpMessage = 'Bienvenido a WiTime, tu centro completo para todas las funciones relacionadas con el tiempo.';
    }
    
    Notificacion(helpMessage, 'info');
  });

  // Navegación entre secciones
  $('.nav-link').on('click', function() {
    // Usar la función adrm para manejar la activación
    adrm(this, 'active');
    
    const sectionId = $(this).data('section');
    const sectionTitle = $(this).find('span').text();
    
    $('#pageTitle').text(sectionTitle);
    
    $('.content-section').removeClass('active');
    $('#' + sectionId).addClass('active fade-in');
    
    // En móviles, cerrar sidebar después de hacer clic
    if (window.innerWidth < 992) {
      $('.sidebar').removeClass('active');
      $('.sidebar-overlay').removeClass('active');
    }
    
    // Si es la sección de calendario, inicializar o actualizar FullCalendar
    if (sectionId === 'calendar') {
      initializeCalendar();
    }
  });

  // Configuración inicial para el dashboard
  function setupDashboard() {
    const container = document.getElementById('timeDashboard');
    
    // Crear el destacado de hora actual si no existe
    if (!document.getElementById('currentTimeDisplay')) {
      const timeDisplay = document.createElement('div');
      timeDisplay.className = 'current-time-display slide-in';
      timeDisplay.id = 'currentTimeDisplay';
      
      const pulseCircle = document.createElement('div');
      pulseCircle.className = 'pulse-circle';
      
      const timeValue = document.createElement('div');
      timeValue.className = 'current-time-value';
      timeValue.id = 'currentTimeValue';
      timeValue.textContent = '--:--:--';
      
      const timeLabel = document.createElement('div');
      timeLabel.className = 'current-time-label';
      timeLabel.textContent = 'HORA ACTUAL';
      
      const dateValue = document.createElement('div');
      dateValue.className = 'current-date-value';
      dateValue.id = 'currentDateValue';
      dateValue.textContent = '-------';
      
      timeDisplay.appendChild(pulseCircle);
      timeDisplay.appendChild(timeValue);
      timeDisplay.appendChild(timeLabel);
      timeDisplay.appendChild(dateValue);
      
      container.appendChild(timeDisplay);
    }
    
    // Crear tarjetas si no existen
    const cards = [
      { id: 'dayOfYear', label: 'Día del Año', icon: 'fa-sun' },
      { id: 'weekOfYear', label: 'Semana del Año', icon: 'fa-calendar-week' },
      { id: 'quarter', label: 'Trimestre', icon: 'fa-chart-pie' },
      { id: 'unixTimestamp', label: 'Timestamp Unix', icon: 'fa-stopwatch' },
      { id: 'milliseconds', label: 'Milisegundos', icon: 'fa-hourglass-half' },
      { id: 'isLeapYear', label: 'Año Bisiesto', icon: 'fa-calendar-plus' },
      { id: 'daysInMonth', label: 'Días en el Mes', icon: 'fa-calendar-alt' },
      { id: 'northSeason', label: 'Estación (Norte)', icon: 'fa-sun' },
      { id: 'southSeason', label: 'Estación (Sur)', icon: 'fa-snowflake' },
      { id: 'dayLength', label: 'Duración Aprox. del Día', icon: 'fa-sun' },
      { id: 'isoDate', label: 'Fecha ISO', icon: 'fa-globe' },
      { id: 'utcTime', label: 'Hora UTC', icon: 'fa-globe' },
      { id: 'lunarPhase', label: 'Fase Lunar', icon: 'fa-moon' }
    ];
    
    cards.forEach((card, index) => {
      if (!document.getElementById(`card-${card.id}`)) {
        const cardElement = document.createElement('div');
        cardElement.className = 'time-card slide-in';
        cardElement.id = `card-${card.id}`;
        cardElement.style.setProperty('--animation-order', index + 1);
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'time-card-value';
        valueDiv.id = card.id;
        valueDiv.textContent = '--';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'time-card-label';
        labelDiv.textContent = card.label;
        
        const iconI = document.createElement('i');
        iconI.className = `fas ${card.icon} time-card-icon`;
        
        cardElement.appendChild(valueDiv);
        cardElement.appendChild(labelDiv);
        cardElement.appendChild(iconI);
        
        container.appendChild(cardElement);
      }
    });
    
    // Agregar reloj analógico si no existe
    if (!document.getElementById('analog-clock')) {
      const clockContainer = document.createElement('div');
      clockContainer.className = 'analog-clock-container slide-in';
      clockContainer.id = 'analog-clock';
      clockContainer.style.setProperty('--animation-order', cards.length + 1);
      
      const clockFace = document.createElement('div');
      clockFace.className = 'analog-clock-face';
      
      // Crear manecillas de reloj
      const hourHand = document.createElement('div');
      hourHand.className = 'clock-hand hour-hand';
      hourHand.id = 'hour-hand';
      
      const minuteHand = document.createElement('div');
      minuteHand.className = 'clock-hand minute-hand';
      minuteHand.id = 'minute-hand';
      
      const secondHand = document.createElement('div');
      secondHand.className = 'clock-hand second-hand';
      secondHand.id = 'second-hand';
      
      const clockCenter = document.createElement('div');
      clockCenter.className = 'clock-center';
      
      // Añadir marcadores de hora
      for (let i = 1; i <= 12; i++) {
        const marker = document.createElement('div');
        marker.className = 'hour-marker';
        marker.textContent = i;
        const angle = (i - 3) * 30; // 30 grados por hora, comenzando desde las 3 en punto
        const radian = angle * (Math.PI / 180);
        const radius = 80; // Radio para colocar los marcadores
        
        const x = Math.cos(radian) * radius;
        const y = Math.sin(radian) * radius;
        
        marker.style.transform = `translate(${x}px, ${y}px)`;
        clockFace.appendChild(marker);
      }
      
      // Ensamblar el reloj
      clockFace.appendChild(hourHand);
      clockFace.appendChild(minuteHand);
      clockFace.appendChild(secondHand);
      clockFace.appendChild(clockCenter);
      
      clockContainer.appendChild(clockFace);
      
      const clockLabel = document.createElement('div');
      clockLabel.className = 'clock-label';
      clockLabel.textContent = 'Reloj Analógico';
      
      clockContainer.appendChild(clockLabel);
      container.appendChild(clockContainer);
    }
  }

  // Inicializar la estructura del dashboard
  setupDashboard();

  // Actualización del dashboard optimizada para menor consumo de memoria
  let lastDashboardUpdate = 0;
  
  function updateDashboard(forceUpdate = false) {
    const now = moment();
    const currentTime = now.valueOf();
    
    // Actualizar solo una vez por segundo a menos que se fuerce una actualización
    if (!forceUpdate && currentTime - lastDashboardUpdate < 1000) {
      return;
    }
    
    lastDashboardUpdate = currentTime;
    
    // Actualizar los valores sin reconstruir los elementos
    $('#currentTimeValue').text(now.format('HH:mm:ss'));
    $('#currentDateValue').text(now.format('dddd, D [de] MMMM [de] YYYY'));
    $('#dayOfYear').text(now.dayOfYear());
    $('#weekOfYear').text(Math.ceil(now.dayOfYear() / 7));
    $('#quarter').text(now.quarter());
    $('#unixTimestamp').text(Math.floor(now.valueOf() / 1000));
    $('#milliseconds').text(now.milliseconds());
    $('#isLeapYear').text(now.isLeapYear() ? 'Sí' : 'No');
    $('#daysInMonth').text(now.daysInMonth());
    
    // Actualizar estaciones
    let currentSeason = '';
    const month = now.month();
    if (month >= 2 && month <= 4) {
      currentSeason = 'Primavera';
    } else if (month >= 5 && month <= 7) {
      currentSeason = 'Verano';
    } else if (month >= 8 && month <= 10) {
      currentSeason = 'Otoño';
    } else {
      currentSeason = 'Invierno';
    }
    
    $('#northSeason').text(currentSeason);
    
    const southernSeasons = {
      'Primavera': 'Otoño',
      'Verano': 'Invierno',
      'Otoño': 'Primavera',
      'Invierno': 'Verano'
    };
    
    $('#southSeason').text(southernSeasons[currentSeason]);
    
    // Actualizar iconos de estaciones según la temporada
    const northIcon = document.querySelector('#card-northSeason i');
    const southIcon = document.querySelector('#card-southSeason i');
    
    if (northIcon) {
      northIcon.className = `fas ${month >= 2 && month <= 7 ? 'fa-sun' : 'fa-snowflake'} time-card-icon`;
    }
    
    if (southIcon) {
      southIcon.className = `fas ${month >= 8 || month <= 1 ? 'fa-sun' : 'fa-snowflake'} time-card-icon`;
    }
    
    // Actualizar duración del día
    $('#dayLength').text(calculateDayLength(now));
    
    // Actualizar ISO y UTC
    const isoDate = now.toISOString();
    $('#isoDate').text(isoDate.substring(0, 10));
    $('#utcTime').text(isoDate.substring(11, 19));
    
    // Actualizar fase lunar
    const lunarPhase = getLunarPhase(now);
    $('#lunarPhase').text(lunarPhase.emoji);
    $('#card-lunarPhase .time-card-label').text(lunarPhase.name);
    
    // Actualizar reloj analógico
    updateAnalogClock(now);
  }

  // Función para calcular la fase lunar aproximada
  function getLunarPhase(date) {
    const lunarMonth = 29.53059;
    const known = moment('2020-01-10', 'YYYY-MM-DD'); // Luna llena conocida
    const daysSince = date.diff(known, 'days');
    const phase = ((daysSince % lunarMonth) / lunarMonth) * 8;
    const phaseIndex = Math.round(phase) % 8;
    
    const phases = [
      { name: 'Luna Nueva', emoji: '🌑' },
      { name: 'Luna Creciente', emoji: '🌒' },
      { name: 'Cuarto Creciente', emoji: '🌓' },
      { name: 'Gibosa Creciente', emoji: '🌔' },
      { name: 'Luna Llena', emoji: '🌕' },
      { name: 'Gibosa Menguante', emoji: '🌖' },
      { name: 'Cuarto Menguante', emoji: '🌗' },
      { name: 'Luna Menguante', emoji: '🌘' }
    ];
    
    return phases[phaseIndex];
  }
  
  // Función para actualizar el reloj analógico
  function updateAnalogClock(now) {
    const hours = now.hours() % 12;
    const mins = now.minutes();
    const secs = now.seconds();
    
    const hourDeg = (360 / 12) * hours + (360 / 12 / 60) * mins;
    const minDeg = (360 / 60) * mins + (360 / 60 / 60) * secs;
    const secDeg = (360 / 60) * secs;
    
    $('#hour-hand').css('transform', `rotate(${hourDeg}deg)`);
    $('#minute-hand').css('transform', `rotate(${minDeg}deg)`);
    $('#second-hand').css('transform', `rotate(${secDeg}deg)`);
  }
  
  // Función para calcular aproximadamente la duración del día
  function calculateDayLength(date) {
    // Esta es una aproximación simplificada, el cálculo real requeriría usar la ubicación geográfica
    const month = date.month();
    
    // En el hemisferio norte: días más largos en verano, más cortos en invierno
    // Aproximación basada en promedios
    let hours;
    
    if (month === 5 || month === 6) { // Junio, Julio
      hours = 14.5;
    } else if (month === 4 || month === 7) { // Mayo, Agosto
      hours = 13.5;
    } else if (month === 3 || month === 8) { // Abril, Septiembre
      hours = 12.5;
    } else if (month === 2 || month === 9) { // Marzo, Octubre
      hours = 11.5;
    } else if (month === 1 || month === 10) { // Febrero, Noviembre
      hours = 10.5;
    } else { // Enero, Diciembre
      hours = 9.5;
    }
    
    const hourInt = Math.floor(hours);
    const minutesDecimal = (hours - hourInt) * 60;
    return `${hourInt}h ${Math.round(minutesDecimal)}m`;
  }

  // Primera actualización del dashboard
  updateDashboard(true);
  
  // Usar requestAnimationFrame para mejor rendimiento que setInterval
  function animationLoop() {
    updateDashboard();
    requestAnimationFrame(animationLoop);
  }
  
  // Iniciar bucle de animación optimizado
  requestAnimationFrame(animationLoop);

  // Pre-llenar los campos de fecha con la fecha actual
  const nowString = moment().format('YYYY-MM-DDTHH:mm');
  $('#startDateTime').val(nowString);
  $('#endDateTime').val(moment().add(1, 'days').format('YYYY-MM-DDTHH:mm'));
  $('#dateTimeInput').val(nowString);

  // Calculadora de diferencia de tiempo
  $('#calculateDifference').on('click', function() {
    const startValue = $('#startDateTime').val();
    const endValue = $('#endDateTime').val();
    
    if (!startValue || !endValue) {
      Notificacion('Por favor completa ambas fechas', 'error');
      return;
    }
    
    const start = moment(startValue);
    const end = moment(endValue);
    
    if (!start.isValid() || !end.isValid()) {
      Notificacion('Por favor ingresa fechas válidas', 'error');
      return;
    }
    
    $('.result-value').html('<div class="shimmer" style="height: 24px; width: 100%; border-radius: 4px;"></div>');
    
    setTimeout(() => {
      try {
        const [earlierDate, laterDate] = start.isBefore(end) ? [start, end] : [end, start];
        const duration = moment.duration(laterDate.diff(earlierDate));
        
        const years = duration.years();
        const months = duration.months();
        const days = duration.days();
        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        
        const totalDays = duration.asDays();
        const totalSeconds = duration.asSeconds();
        
        $('#yearMonthDay').text(`${years} años, ${months} meses, ${days} días`);
        $('#hourMinuteSecond').text(`${hours} horas, ${minutes} minutos, ${seconds} segundos`);
        $('#totalDays').text(`${totalDays.toFixed(2)} días`);
        $('#totalSeconds').text(`${totalSeconds.toFixed(0)} segundos`);
        
        $('.result-card').addClass('slide-in').css('opacity', 1);
        
        for (let i = 0; i < $('.result-card').length; i++) {
          $('.result-card').eq(i).css('--animation-order', i);
        }
        
        Mensaje('Cálculo completado', 'success');
      } catch (error) {
        Notificacion('Error al calcular la diferencia de tiempo', 'error');
        console.error(error);
      }
    }, 800);
  });

  // Calculadora de edad
  $('#calculateAge').on('click', function() {
    const birthDateValue = $('#birthDate').val();
    
    if (!birthDateValue) {
      Notificacion('Por favor ingresa tu fecha de nacimiento', 'error');
      return;
    }
    
    const birthDate = moment(birthDateValue);
    
    if (!birthDate.isValid()) {
      Notificacion('Por favor ingresa una fecha de nacimiento válida', 'error');
      return;
    }
    
    if (birthDate.isAfter(moment())) {
      Notificacion('La fecha de nacimiento no puede ser en el futuro', 'error');
      return;
    }
    
    $('.result-card .result-value').html('<div class="shimmer" style="height: 24px; width: 100%; border-radius: 4px;"></div>');
    
    setTimeout(() => {
      try {
        const now = moment();
        const age = now.diff(birthDate, 'years');
        const nextBirthdayThisYear = moment(birthDate).year(now.year());
        
        if (nextBirthdayThisYear.isBefore(now)) {
          nextBirthdayThisYear.add(1, 'year');
        }
        
        const daysUntilBirthday = nextBirthdayThisYear.diff(now, 'days');
        const daysLived = now.diff(birthDate, 'days');
        const hoursLived = now.diff(birthDate, 'hours');
        
        $('#currentAge').text(`${age} años`);
        $('#nextBirthday').text(`${daysUntilBirthday} días (${nextBirthdayThisYear.format('DD/MM/YYYY')})`);
        $('#daysLived').text(`${daysLived.toLocaleString()} días`);
        $('#hoursLived').text(`${hoursLived.toLocaleString()} horas`);
        
        $('#calculator .result-card').addClass('slide-in').css('opacity', 1);
        
        for (let i = 0; i < $('#calculator .result-card').length; i++) {
          $('#calculator .result-card').eq(i).css('--animation-order', i);
        }
        
        Mensaje('Edad calculada correctamente', 'success');
      } catch (error) {
        Notificacion('Error al calcular la edad', 'error');
        console.error(error);
      }
    }, 800);
  });

  // Conversor de unidades de tiempo
  $('#convertTime').on('click', function() {
    const value = parseFloat($('#timeValue').val());
    
    if (!$('#timeValue').val()) {
      Notificacion('Por favor ingresa un valor para convertir', 'error');
      return;
    }
    
    if (isNaN(value)) {
      Notificacion('Por favor ingresa un valor numérico válido', 'error');
      return;
    }
    
    const fromUnit = $('#fromUnit').val();
    const toUnit = $('#toUnit').val();
    
    $('#conversionResult').html('<div class="shimmer" style="height: 24px; width: 100%; border-radius: 4px;"></div>');
    
    setTimeout(() => {
      try {
        const conversionRates = {
          seconds: 1,
          minutes: 60,
          hours: 3600,
          days: 86400,
          weeks: 604800,
          months: 2628000,
          years: 31557600,
          decades: 315576000,
          centuries: 3155760000,
          millennia: 31557600000
        };
        
        const valueInSeconds = value * conversionRates[fromUnit];
        const result = valueInSeconds / conversionRates[toUnit];
        
        $('#conversionResult').text(`${value.toLocaleString()} ${fromUnit} = ${result.toLocaleString('es-ES', {maximumFractionDigits: 6})} ${toUnit}`);
        
        $('#conversionResult').addClass('animate-pulse');
        setTimeout(() => $('#conversionResult').removeClass('animate-pulse'), 1500);
        
        Mensaje('Conversión realizada con éxito', 'success');
      } catch (error) {
        Notificacion('Error al realizar la conversión', 'error');
        console.error(error);
      }
    }, 600);
  });

  // Conversor Unix-Fecha
  $('#convertUnixToDate').on('click', function() {
    if (!$('#unixTimestamp').val()) {
      Notificacion('Por favor ingresa un timestamp Unix', 'error');
      return;
    }
    
    const timestamp = parseInt($('#unixTimestamp').val());
    
    if (isNaN(timestamp)) {
      Notificacion('Por favor ingresa un timestamp Unix válido', 'error');
      return;
    }
    
    if (timestamp < 0) {
      Notificacion('El timestamp Unix no puede ser negativo', 'error');
      return;
    }
    
    $('#dateResult').html('<div class="shimmer" style="height: 24px; width: 100%; border-radius: 4px;"></div>');
    
    setTimeout(() => {
      try {
        const date = moment.unix(timestamp);
        $('#dateResult').text(date.format('DD/MM/YYYY HH:mm:ss'));
        
        $('#dateResult').addClass('animate-pulse');
        setTimeout(() => $('#dateResult').removeClass('animate-pulse'), 1500);
        
        Mensaje('Conversión realizada correctamente', 'success');
      } catch (error) {
        Notificacion('Error al convertir timestamp a fecha', 'error');
        console.error(error);
      }
    }, 400);
  });

  // Conversor Fecha-Unix
  $('#convertDateToUnix').on('click', function() {
    const dateTimeString = $('#dateTimeInput').val();
    
    if (!dateTimeString) {
      Notificacion('Por favor ingresa una fecha y hora', 'error');
      return;
    }
    
    $('#unixResult').html('<div class="shimmer" style="height: 24px; width: 100%; border-radius: 4px;"></div>');
    
    setTimeout(() => {
      try {
        const dateTime = moment(dateTimeString);
        
        if (!dateTime.isValid()) {
          throw new Error('Fecha no válida');
        }
        
        $('#unixResult').text(dateTime.unix());
        
        $('#unixResult').addClass('animate-pulse');
        setTimeout(() => $('#unixResult').removeClass('animate-pulse'), 1500);
        
        Mensaje('Conversión realizada correctamente', 'success');
      } catch (error) {
        Notificacion('Error al convertir fecha a timestamp Unix', 'error');
        console.error(error);
      }
    }, 400);
  });

  // Inicializar timestamp Unix actual
  $('#unixTimestamp').val(Math.floor(Date.now() / 1000));

  // Zonas horarias - Optimizado para reducir recreación DOM
  let lastTimezoneUpdate = 0;
  
  function updateTimezones() {
    const now = new Date();
    const currentTime = now.getTime();
    
    if (currentTime - lastTimezoneUpdate < 1000) {
      return;
    }
    
    lastTimezoneUpdate = currentTime;
    
    const timezoneData = [
      { city: 'Madrid', icon: 'fa-landmark', offset: '+01:00', region: 'Europa' },
      { city: 'Londres', icon: 'fa-clock', offset: '+00:00', region: 'Europa' },
      { city: 'París', icon: 'fa-wine-glass', offset: '+01:00', region: 'Europa' },
      { city: 'Nueva York', icon: 'fa-city', offset: '-05:00', region: 'Norteamérica' },
      { city: 'Los Ángeles', icon: 'fa-film', offset: '-08:00', region: 'Norteamérica' },
      { city: 'Ciudad de México', icon: 'fa-pepper-hot', offset: '-06:00', region: 'Norteamérica' },
      { city: 'Tokio', icon: 'fa-torii-gate', offset: '+09:00', region: 'Asia' },
      { city: 'Sídney', icon: 'fa-monument', offset: '+11:00', region: 'Oceanía' },
      { city: 'Dubai', icon: 'fa-building', offset: '+04:00', region: 'Oriente Medio' },
      { city: 'Moscú', icon: 'fa-chess-rook', offset: '+03:00', region: 'Europa' },
      { city: 'Buenos Aires', icon: 'fa-map-pin', offset: '-03:00', region: 'Sudamérica' },
      { city: 'São Paulo', icon: 'fa-map-pin', offset: '-03:00', region: 'Sudamérica' },
      { city: 'Río de Janeiro', icon: 'fa-umbrella-beach', offset: '-03:00', region: 'Sudamérica' },
      { city: 'Santiago', icon: 'fa-mountain', offset: '-04:00', region: 'Sudamérica' },
      { city: 'Lima', icon: 'fa-map-pin', offset: '-05:00', region: 'Sudamérica' },
      { city: 'Bogotá', icon: 'fa-coffee', offset: '-05:00', region: 'Sudamérica' },
      { city: 'Caracas', icon: 'fa-map-pin', offset: '-04:00', region: 'Sudamérica' },
      { city: 'Quito', icon: 'fa-map-pin', offset: '-05:00', region: 'Sudamérica' },
      { city: 'La Paz', icon: 'fa-mountain', offset: '-04:00', region: 'Sudamérica' },
      { city: 'Asunción', icon: 'fa-map-pin', offset: '-04:00', region: 'Sudamérica' }
    ];
    
    const container = document.getElementById('timezoneContainer');
    const isFirstRender = container.children.length === 0;
    
    if (isFirstRender) {
      const fragment = document.createDocumentFragment();
      const regions = [...new Set(timezoneData.map(tz => tz.region))];
      
      regions.forEach(region => {
        const regionHeader = document.createElement('h3');
        regionHeader.className = 'region-header slide-in';
        regionHeader.innerHTML = `<i class="fas fa-globe-americas"></i> ${region}`;
        fragment.appendChild(regionHeader);
        
        const regionCities = timezoneData.filter(tz => tz.region === region);
        
        regionCities.forEach((tz, index) => {
          const card = document.createElement('div');
          card.className = 'timezone-card slide-in';
          card.style.setProperty('--animation-order', index);
          card.dataset.city = tz.city;
          card.dataset.region = tz.region;
          
          const cityDiv = document.createElement('div');
          cityDiv.className = 'timezone-city';
          cityDiv.innerHTML = `<i class="fas ${tz.icon}"></i> ${tz.city}`;
          
          const timeDiv = document.createElement('div');
          timeDiv.className = 'timezone-time';
          timeDiv.id = `time-${tz.city.replace(/\s+/g, '-').toLowerCase()}`;
          
          const dateDiv = document.createElement('div');
          dateDiv.className = 'timezone-date';
          dateDiv.id = `date-${tz.city.replace(/\s+/g, '-').toLowerCase()}`;
          
          const offsetDiv = document.createElement('div');
          offsetDiv.className = 'timezone-offset';
          offsetDiv.textContent = `UTC ${tz.offset}`;
          
          card.appendChild(cityDiv);
          card.appendChild(timeDiv);
          card.appendChild(dateDiv);
          card.appendChild(offsetDiv);
          
          fragment.appendChild(card);
        });
      });
      
      container.appendChild(fragment);
    }
    
    timezoneData.forEach((tz) => {
      const localTime = new Date(now);
      const offsetHours = parseInt(tz.offset.substring(0, 3));
      const offsetMinutes = parseInt(tz.offset.substring(4, 6)) * (tz.offset[0] === '-' ? -1 : 1);
      
      localTime.setHours(localTime.getHours() + offsetHours);
      localTime.setMinutes(localTime.getMinutes() + offsetMinutes);
      
      const hours = localTime.getHours().toString().padStart(2, '0');
      const minutes = localTime.getMinutes().toString().padStart(2, '0');
      const seconds = localTime.getSeconds().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:${seconds}`;
      
      const options = { weekday: 'long', day: 'numeric', month: 'long' };
      const dateString = localTime.toLocaleDateString('es-ES', options);
      
      const cityKey = tz.city.replace(/\s+/g, '-').toLowerCase();
      const timeElement = document.getElementById(`time-${cityKey}`);
      const dateElement = document.getElementById(`date-${cityKey}`);
      
      if (timeElement) timeElement.textContent = timeString;
      if (dateElement) dateElement.textContent = dateString;
    });
  }

  // Inicializar zonas horarias
  updateTimezones();
  
  function timezoneAnimationLoop() {
    updateTimezones();
    requestAnimationFrame(timezoneAnimationLoop);
  }
  
  requestAnimationFrame(timezoneAnimationLoop);

  // Filtro de zonas horarias
  $('#timezoneFilter').on('click', 'button', function() {
    const region = $(this).data('region');
    
    $('#timezoneFilter button').removeClass('active');
    $(this).addClass('active');
    
    if (region === 'all') {
      $('.timezone-card').fadeIn(300);
      $('.region-header').fadeIn(300);
    } else {
      $('.timezone-card').hide();
      $('.region-header').hide();
      $(`.timezone-card[data-region="${region}"]`).fadeIn(300);
      $(`.region-header:contains('${region}')`).fadeIn(300);
    }
  });

  // Inicializar FullCalendar
  function initializeCalendar() {
    const calendarEl = document.getElementById('fullCalendar');
    
    if (!calendarEl) return;
    
    $('.calendar-loading').show();
    
    try {
      if (calendar) {
        calendar.render();
        $('.calendar-loading').hide();
        return;
      }
      
      calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'es',
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        timeZone: 'local',
        themeSystem: 'standard',
        height: 'auto',
        events: [
          {
            title: 'Evento de ejemplo',
            start: moment().format('YYYY-MM-DD'),
            backgroundColor: 'var(--accent)',
            borderColor: 'var(--accent)'
          },
          {
            title: 'Evento de varios días',
            start: moment().add(3, 'days').format('YYYY-MM-DD'),
            end: moment().add(5, 'days').format('YYYY-MM-DD'),
            backgroundColor: '#38a169',
            borderColor: '#38a169'
          }
        ],
        select: function(info) {
          const title = prompt('Ingresa un título para tu evento:');
          if (title) {
            calendar.addEvent({
              title: title,
              start: info.startStr,
              end: info.endStr,
              allDay: info.allDay,
              backgroundColor: 'var(--accent)',
              borderColor: 'var(--accent)'
            });
            
            Notificacion(`Evento "${title}" creado correctamente`, 'success');
          }
          calendar.unselect();
        },
        eventClick: function(info) {
          if (confirm(`¿Quieres eliminar el evento '${info.event.title}'?`)) {
            const eventTitle = info.event.title;
            info.event.remove();
            Notificacion(`Evento "${eventTitle}" eliminado`, 'info');
          }
        },
        eventDidMount: function(info) {
          $(info.el).attr('title', info.event.title);
        },
        loading: function(isLoading) {
          if (!isLoading) {
            $('.calendar-loading').hide();
          }
        }
      });
      
      calendar.render();
      Mensaje('Calendario cargado correctamente', 'success');
      
    } catch (error) {
      console.error('Error inicializando FullCalendar:', error);
      $('.calendar-loading').hide();
      $('#fullCalendar').html(`
        <div class="glass-card">
          <div class="card-body text-center">
            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--accent); margin-bottom: 20px;"></i>
            <h3>Error al cargar el calendario</h3>
            <p>Asegúrate de que FullCalendar esté correctamente instalado.</p>
            <p><small>Error: ${error.message}</small></p>
          </div>
        </div>
      `);
      
      Notificacion('Error al cargar el calendario', 'error');
    }
  }

  // Temporizador y Cronómetro
  let timerInterval;
  let timerSeconds = 300;
  let timerRunning = false;

  function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    $('#timerDisplay').text(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  }

  $('#timerMinutes').on('change', function() {
    const value = parseInt($(this).val());
    
    if (timerRunning) {
      Notificacion('No puedes cambiar el tiempo mientras el temporizador está en marcha', 'warning');
      $(this).val(Math.floor(timerSeconds / 60));
      return;
    }
    
    if (isNaN(value) || value <= 0) {
      Notificacion('Por favor ingresa un valor positivo válido', 'error');
      $(this).val(5);
      timerSeconds = 300;
    } else {
      timerSeconds = value * 60;
    }
    
    updateTimerDisplay();
  });

  $('#startTimer').on('click', function() {
    if (!timerRunning) {
      timerRunning = true;
      $(this).addClass('animate-pulse');
      timerInterval = setInterval(function() {
        if (timerSeconds > 0) {
          timerSeconds--;
          updateTimerDisplay();
          
          if (timerSeconds <= 10 && timerSeconds > 0) {
            $('#timerDisplay').toggleClass('animate-glow');
          }
        } else {
          clearInterval(timerInterval);
          timerRunning = false;
          $('#startTimer').removeClass('animate-pulse');
          Notificacion('¡Tiempo terminado!', 'success');
          $('#timerDisplay').addClass('glow-effect');
          setTimeout(() => $('#timerDisplay').removeClass('glow-effect'), 5000);
        }
      }, 1000);
      
      Mensaje('Temporizador iniciado', 'success');
    }
  });

  $('#pauseTimer').on('click', function() {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      $('#startTimer').removeClass('animate-pulse');
      $('#timerDisplay').removeClass('animate-glow');
      
      Mensaje('Temporizador pausado', 'info');
    }
  });

  $('#resetTimer').on('click', function() {
    clearInterval(timerInterval);
    timerRunning = false;
    $('#startTimer').removeClass('animate-pulse');
    timerSeconds = parseInt($('#timerMinutes').val()) * 60;
    updateTimerDisplay();
    $('#timerDisplay').removeClass('glow-effect animate-glow');
    
    Mensaje('Temporizador reiniciado', 'info');
  });

  updateTimerDisplay();

  let stopwatchInterval;
  let stopwatchSeconds = 0;
  let stopwatchRunning = false;

  function updateStopwatchDisplay() {
    const hours = Math.floor(stopwatchSeconds / 3600);
    const minutes = Math.floor((stopwatchSeconds % 3600) / 60);
    const seconds = stopwatchSeconds % 60;
    $('#stopwatchDisplay').text(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  }

  $('#startStopwatch').on('click', function() {
    if (!stopwatchRunning) {
      stopwatchRunning = true;
      $(this).addClass('animate-pulse');
      stopwatchInterval = setInterval(function() {
        stopwatchSeconds++;
        updateStopwatchDisplay();
      }, 1000);
      
      Mensaje('Cronómetro iniciado', 'success');
    }
  });

  $('#pauseStopwatch').on('click', function() {
    if (stopwatchRunning) {
      clearInterval(stopwatchInterval);
      stopwatchRunning = false;
      $('#startStopwatch').removeClass('animate-pulse');
      
      Mensaje('Cronómetro pausado', 'info');
    }
  });

  $('#resetStopwatch').on('click', function() {
    clearInterval(stopwatchInterval);
    stopwatchRunning = false;
    $('#startStopwatch').removeClass('animate-pulse');
    stopwatchSeconds = 0;
    updateStopwatchDisplay();
    
    Mensaje('Cronómetro reiniciado', 'info');
  });

  updateStopwatchDisplay();
});

