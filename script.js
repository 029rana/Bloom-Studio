// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const dropdowns = document.querySelectorAll('.dropdown');
const navbar = document.querySelector('.navbar');

// Mobile Navigation Toggle
function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    
    // Close dropdowns when closing mobile menu
    if (!navMenu.classList.contains('active')) {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
}

// Toggle Dropdown on Mobile
function toggleDropdown(event) {
    if (window.innerWidth <= 768) {
        event.preventDefault();
        const dropdown = event.currentTarget;
        dropdown.classList.toggle('active');
        
        // Close other dropdowns
        dropdowns.forEach(item => {
            if (item !== dropdown && item.classList.contains('active')) {
                item.classList.remove('active');
            }
        });
    }
}

// Navbar Scroll Effect
function handleScroll() {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Update active nav link based on scroll position
    updateActiveNavLink();
}

// Update Active Navigation Link
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-menu a[href*="${sectionId}"]`);
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLink?.classList.add('active');
        } else {
            navLink?.classList.remove('active');
        }
    });
}

// Initialize Smooth Scroll for Anchor Links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's a dropdown toggle on mobile
            if (this.classList.contains('dropdown-toggle') && window.innerWidth <= 768) {
                return;
            }
            
            // If it's a regular anchor link
            if (href.startsWith('#')) {
                e.preventDefault();
                
                const target = document.querySelector(href);
                if (target) {
                    // Close mobile menu if open
                    if (navMenu.classList.contains('active')) {
                        toggleMobileMenu();
                    }
                    
                    // Smooth scroll to target
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Form Handling Functions
class FormHandler {
    constructor() {
        this.bookings = JSON.parse(localStorage.getItem('studioBookings')) || [];
        this.initForms();
    }
    
    initForms() {
        this.initBookingForm();
        this.initStatusForm();
    }
    
    initBookingForm() {
        // DISABLED - Form submit handler ada di booking.html
        // Initialize date picker min date
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
        }
    }
    
    initStatusForm() {
        // Disabled: status search handled in pages/status.html
    }
    
    generateBookingId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `BS${timestamp}${random}`.toUpperCase();
    }
    
    handleBookingSubmit(form) {
        // Get form data
        const formData = {
            id: this.generateBookingId(),
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            package: document.getElementById('package').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            message: document.getElementById('message').value.trim(),
            status: 'pending',
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        // Validate form
        if (!this.validateBookingForm(formData)) {
            return;
        }
        
        // Save to local storage
        this.saveBooking(formData);
        
        // Show success message
        this.showNotification('Booking berhasil dibuat! ID Booking: ' + formData.id, 'success');
        
        // Reset form
        form.reset();
        
        // Log to console (for development)
        console.log('Booking created:', formData);
        
        // Here you would typically send to Google Sheets
        // this.submitToGoogleSheets(formData);
    }
    
    validateBookingForm(data) {
        // Basic validation
        if (!data.name || data.name.length < 3) {
            this.showNotification('Nama minimal 3 karakter', 'error');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showNotification('Email tidak valid', 'error');
            return false;
        }
        
        const phoneRegex = /^[0-9]{10,13}$/;
        if (!phoneRegex.test(data.phone.replace(/\D/g, ''))) {
            this.showNotification('Nomor telepon tidak valid (10-13 angka)', 'error');
            return false;
        }
        
        if (!data.date) {
            this.showNotification('Harap pilih tanggal', 'error');
            return false;
        }
        
        if (!data.time) {
            this.showNotification('Harap pilih waktu', 'error');
            return false;
        }
        
        return true;
    }
    
    saveBooking(booking) {
        this.bookings.unshift(booking);
        localStorage.setItem('studioBookings', JSON.stringify(this.bookings));
    }
    
    checkBookingStatus() {
        const bookingId = document.getElementById('bookingId').value.trim().toUpperCase();
        const statusResult = document.getElementById('statusResult');
        
        if (!bookingId) {
            this.showNotification('Harap masukkan ID Booking', 'error');
            return;
        }
        
        const booking = this.bookings.find(b => b.id === bookingId);
        
        if (!booking) {
            statusResult.innerHTML = `
                <div class="status-card error">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Booking Tidak Ditemukan</h3>
                    <p>ID Booking <strong>${bookingId}</strong> tidak ditemukan dalam sistem.</p>
                    <p>Pastikan ID Booking yang dimasukkan sudah benar.</p>
                </div>
            `;
            return;
        }
        
        // Map status to Indonesian
        const statusMap = {
            'pending': 'Menunggu Konfirmasi',
            'confirmed': 'Terkonfirmasi',
            'in_progress': 'Sedang Diproses',
            'completed': 'Selesai',
            'cancelled': 'Dibatalkan'
        };
        
        // Status badge class
        const statusClass = {
            'pending': 'status-pending',
            'confirmed': 'status-confirmed',
            'in_progress': 'status-progress',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        
        const statusText = statusMap[booking.status] || booking.status;
        const statusClassText = statusClass[booking.status] || 'status-pending';
        
        statusResult.innerHTML = `
            <div class="status-card success">
                <div class="status-header">
                    <h3><i class="fas fa-clipboard-check"></i> Status Booking</h3>
                    <span class="status-badge ${statusClassText}">${statusText}</span>
                </div>
                <div class="status-details">
                    <div class="detail-row">
                        <span class="detail-label">ID Booking:</span>
                        <span class="detail-value">${booking.id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Nama:</span>
                        <span class="detail-value">${booking.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Paket:</span>
                        <span class="detail-value">${booking.package}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Tanggal:</span>
                        <span class="detail-value">${new Date(booking.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Waktu:</span>
                        <span class="detail-value">${booking.time}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Dibuat:</span>
                        <span class="detail-value">${new Date(booking.created).toLocaleDateString('id-ID')}</span>
                    </div>
                </div>
                <div class="status-actions">
                    <button class="btn-primary" onclick="window.location.href='pages/booking.html'">
                        <i class="fas fa-calendar-plus"></i> Buat Booking Baru
                    </button>
                </div>
            </div>
        `;
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
        // Close button event
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
    
    async submitToGoogleSheets(formData) {
        // This would be your Google Sheets integration
        // Example using Google Apps Script
        try {
            const scriptURL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
            const response = await fetch(scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            console.log('Submitted to Google Sheets:', formData);
        } catch (error) {
            console.error('Error submitting to Google Sheets:', error);
            // Fallback to localStorage only
        }
    }
}

// Initialize Animations
function initAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .portfolio-item, .package-card').forEach(el => {
        observer.observe(el);
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }
    
    // Initialize dropdowns
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        if (toggle) {
            toggle.addEventListener('click', toggleDropdown);
        }
    });
    
    // Initialize scroll effects
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    // Initialize smooth scroll
    initSmoothScroll();
    
    // Initialize form handler
    window.formHandler = new FormHandler();
    
    // Initialize animations
    initAnimations();
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar') && navMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
    });
    
    // Add notification styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            transform: translateX(150%);
            transition: transform 0.3s ease;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-success {
            background-color: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
        }
        
        .notification-error {
            background-color: #f8d7da;
            color: #721c24;
            border-left: 4px solid #dc3545;
        }
        
        .notification-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            margin-left: auto;
            padding: 0 0.5rem;
        }
    `;
    document.head.appendChild(style);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormHandler };
}