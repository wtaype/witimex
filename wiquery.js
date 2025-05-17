import $ from 'jquery'; 

// ACTUALIZAR CLASES 
export const adrm = (a, b) => {
    $(a).addClass(b).siblings().removeClass(b);
}; 

// SALUDO PERSONALIZADO
export const Saludar = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) {
        return "Buenos días, ";
    } else if (hora >= 12 && hora < 18) {
        return "Buenas tardes, ";
    } else {
        return "Buenas noches, ";
    }
}; 

// NOTIFICACIONES RIGHT CON X 
export function Notificacion(mensaje, tipo = 'error') {
    const iconos = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const colores = {
        success: '#2E7D32',
        error: '#D32F2F',
        warning: '#F9A825',
        info: '#0288D1'
    };

    const $n = $(`
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            min-width: 280px;
            max-width: 90%;
            background: #fff;
            border-left: 4px solid ${colores[tipo]};
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            padding: 12px 16px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            opacity: 0;
            transition: all 0.3s ease;
        ">
            <i class="fas ${iconos[tipo]}" style="color: ${colores[tipo]};"></i>
            <div style="flex: 1;">${mensaje}</div>
            <span style="cursor: pointer;">&times;</span>
        </div>
    `);

    $('body').append($n);
    setTimeout(() => $n.css('opacity', 1), 10);

    $n.find('span').on('click', () => cerrarNotificacion($n));
    setTimeout(() => cerrarNotificacion($n), 5000);
}

function cerrarNotificacion($el) {
    $el.css('opacity', 0);
    setTimeout(() => $el.remove(), 300);
}

// MENSAJE CENTER PERSONALIZADO 
export const Mensaje = (mensaje, tipo = 'error') => {
    $('.alert-box').remove(); // Eliminar existentes

    const colores = {
        error: { bg: '#FFE8E6', txt: '#D32F2F', border: '#FFCDD2', icon: 'fa-circle-exclamation' },
        success: { bg: '#E8F5E9', txt: '#2E7D32', border: '#C8E6C9', icon: 'fa-circle-check' }
    };

    const { bg, txt, border, icon } = colores[tipo] || colores.error;

    const $alerta = $(`
        <div class="alert-box" style="
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 20px;
            border-radius: 8px;
            background: ${bg};
            color: ${txt};
            border-left: 4px solid ${border};
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            max-width: 90%;
        ">
            <i class="fas ${icon}"></i>
            <span>${mensaje}</span>
        </div>
    `).appendTo('body').hide().fadeIn(300);

    setTimeout(() => $alerta.fadeOut(300, () => $alerta.remove()), 3000);
};


// MODELES PREVIEW 
export const openModal = (modalId) => {
    $(`#${modalId}`).addClass('active');
    $('body').addClass('modal-open');
};

export const closeModal = (modalId) => {
    $(`#${modalId}`).removeClass('active');
    $('body').removeClass('modal-open');
};

export const closeAllModals = () => {
    $('.modal').removeClass('active');
    $('body').removeClass('modal-open');
};

// Inicializar eventos para modales
export const initModalSystem = () => {
    // Cerrar modal al hacer clic en el botón de cerrar
    $(document).on('click', '.close-modal', () => {
        closeAllModals();
    });

    // Cerrar modal al hacer clic fuera del contenido
    $(document).on('click', '.modal', (e) => {
        if ($(e.target).hasClass('modal')) {
            closeAllModals();
        }
    });

    // Cerrar modal con la tecla Escape
    $(document).on('keydown', (e) => {
        if (e.key === "Escape") {
            closeAllModals();
        }
    });
    
    // Para cerrar modals (usando delegación de eventos)
    $(document).on('click', '#cancelEmployeeBtn, #cancelNewEmployeeBtn, #cancelImportBtn, #closeRequestBtn, #backToTeamBtn, #cancelMessageBtn, #cancelBenefitBtn, #cancelConfirmationBtn', function() {
        closeAllModals();
    });
}; initModalSystem();
