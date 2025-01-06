// إدارة المستخدمين
const userManagement = {
    // تسجيل مستخدم جديد
    register: function(email, password, fullName, gender) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // التحقق من وجود البريد الإلكتروني
        if (users.find(u => u.email === email)) {
            throw new Error('البريد الإلكتروني مستخدم بالفعل');
        }

        // إنشاء مستخدم جديد
        const newUser = {
            id: Date.now().toString(),
            email,
            password: btoa(password),
            fullName,
            gender,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return newUser;
    },

    // تسجيل الدخول
    login: function(email, password) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === btoa(password));
        
        if (!user) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    },

    // تسجيل الخروج
    logout: function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    },

    // الحصول على المستخدم الحالي
    getCurrentUser: function() {
        const userJson = sessionStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    },

    // تحديث بيانات المستخدم
    updateUser: function(userData) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const currentUser = this.getCurrentUser();
        
        if (!currentUser) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }

        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex === -1) {
            throw new Error('المستخدم غير موجود');
        }

        // تحديث بيانات المستخدم
        const updatedUser = {
            ...users[userIndex],
            ...userData,
            updatedAt: new Date().toISOString()
        };

        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));

        return updatedUser;
    }
};

// التحقق من تسجيل الدخول في كل الصفحات المحمية
function checkAuth() {
    const currentUser = userManagement.getCurrentUser();
    const publicPages = ['auth.html', 'index.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (!currentUser && !publicPages.includes(currentPage)) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// تحديث اسم المستخدم في الشريط العلوي
function updateUserDisplay() {
    const currentUser = userManagement.getCurrentUser();
    if (currentUser) {
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) {
            userNameDisplay.textContent = currentUser.fullName;
        }
    }
}

// تنفيذ عند تحميل أي صفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من تسجيل الدخول وتحديث العرض
    if (checkAuth()) {
        updateUserDisplay();
    }

    // معالجة نموذج التسجيل
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const fullName = document.getElementById('fullName').value;
            const gender = document.getElementById('gender').value;

            if (password !== confirmPassword) {
                alert('كلمتا المرور غير متطابقتين');
                return;
            }

            try {
                userManagement.register(email, password, fullName, gender);
                alert('تم التسجيل بنجاح');
                window.location.href = 'auth.html#login';
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // معالجة نموذج تسجيل الدخول
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                userManagement.login(email, password);
                window.location.href = 'dashboard.html';
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // معالجة نموذج الملف الشخصي
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        const currentUser = userManagement.getCurrentUser();
        
        // ملء البيانات الحالية
        document.getElementById('fullName').value = currentUser.fullName;
        document.getElementById('email').value = currentUser.email;
        document.getElementById('gender').value = currentUser.gender;

        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newFullName = document.getElementById('fullName').value;
            const newGender = document.getElementById('gender').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (newPassword) {
                if (newPassword !== confirmNewPassword) {
                    alert('كلمتا المرور غير متطابقتين');
                    return;
                }
                if (newPassword.length < 6) {
                    alert('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
                    return;
                }
            }

            try {
                userManagement.updateUser({
                    fullName: newFullName,
                    gender: newGender,
                    ...(newPassword && { password: btoa(newPassword) })
                });

                alert('تم تحديث الملف الشخصي بنجاح');
                location.reload();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // تحديث إحصائيات المستخدم في الملف الشخصي
    const userStats = document.getElementById('userStats');
    if (userStats) {
        const currentUser = userManagement.getCurrentUser();
        const evaluations = JSON.parse(localStorage.getItem('prayerEvaluations')) || [];
        const userEvaluations = evaluations.filter(e => e.userId === currentUser.id);

        const stats = {
            total: userEvaluations.length,
            onTime: userEvaluations.filter(e => e.timing === 'onTime').length,
            mosque: userEvaluations.filter(e => e.location === 'mosque').length
        };

        let statsHtml = `
            <div class="col-4">
                <div class="h4">${stats.total}</div>
                <div class="text-muted small">إجمالي التقييمات</div>
            </div>
            <div class="col-4">
                <div class="h4">${stats.onTime}</div>
                <div class="text-muted small">في الوقت</div>
            </div>
        `;

        if (currentUser.gender === 'male') {
            statsHtml += `
                <div class="col-4">
                    <div class="h4">${stats.mosque}</div>
                    <div class="text-muted small">في المسجد</div>
                </div>
            `;
        }

        userStats.innerHTML = statsHtml;
    }
});

// زر تسجيل الخروج
document.querySelectorAll('[onclick="userManagement.logout()"]').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        userManagement.logout();
    });
});

// وظائف إدارة المستخدمين
const userManagementProfile = {
    // تسجيل مستخدم جديد
    register: function(email, password, fullName, gender) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // التحقق من وجود البريد الإلكتروني
        if (users.find(u => u.email === email)) {
            throw new Error('البريد الإلكتروني مستخدم بالفعل');
        }

        // إنشاء مستخدم جديد
        const newUser = {
            id: Date.now().toString(),
            email,
            password: btoa(password),
            fullName,
            gender,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return newUser;
    },

    // تسجيل الدخول
    login: function(email, password) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === btoa(password));
        
        if (!user) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    },

    // تسجيل الخروج
    logout: function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'auth.html';
    },

    // الحصول على المستخدم الحالي
    getCurrentUser: function() {
        const userJson = sessionStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    },

    // تحديث بيانات المستخدم
    updateUser: function(userData) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const currentUser = this.getCurrentUser();
        
        if (!currentUser) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }

        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex === -1) {
            throw new Error('المستخدم غير موجود');
        }

        // تحديث بيانات المستخدم
        const updatedUser = {
            ...users[userIndex],
            ...userData,
            updatedAt: new Date().toISOString()
        };

        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));

        return updatedUser;
    }
};

// التحقق من تسجيل الدخول في كل الصفحات المحمية
function checkAuth() {
    const currentUser = userManagementProfile.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// تحديث اسم المستخدم في الشريط العلوي
function updateUserDisplay() {
    const currentUser = userManagementProfile.getCurrentUser();
    if (currentUser) {
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) {
            userNameDisplay.textContent = currentUser.fullName;
        }
    }
}

// تنفيذ عند تحميل أي صفحة
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('auth.html')) {
        // لا نحتاج للتحقق من تسجيل الدخول في صفحة تسجيل الدخول
        return;
    }
    
    if (checkAuth()) {
        updateUserDisplay();
    }
});

// معالجة نموذج التسجيل
document.getElementById('registerFormElement').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;

    if (password !== confirmPassword) {
        alert('كلمة المرور غير متطابقة');
        return;
    }

    try {
        userManagement.register(fullName, email, password, gender);
        alert('تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول');
        showLoginForm();
    } catch (error) {
        alert(error.message);
    }
});

// معالجة نموذج تسجيل الدخول
document.getElementById('loginFormElement').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const user = userManagement.login(email, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert(error.message);
    }
});

// دالة لتحديد مكان الصلاة المختار
function selectLocation(location) {
    // إزالة التحديد من جميع الأماكن
    document.querySelectorAll('.prayer-location').forEach(el => {
        el.classList.remove('selected');
    });
    
    // تحديد المكان المختار
    const selectedLocation = document.querySelector(`#${location}Loc`);
    selectedLocation.checked = true;
    selectedLocation.closest('.prayer-location').classList.add('selected');
}

document.getElementById('prayerEvaluationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // جمع البيانات من النموذج
    const prayerType = document.getElementById('prayerType').value;
    const prayerLocation = document.querySelector('input[name="prayerLocation"]:checked').value;

    // تحضير النتائج والتوصيات
    let resultMessage = '';
    let recommendations = [];

    if (prayerLocation === 'mosque') {
        resultMessage = '<div class="alert alert-success">' +
            '<h4>أحسنت! 🌟</h4>' +
            '<p>صلاة الجماعة في المسجد أفضل من صلاة الفرد بسبع وعشرين درجة</p>' +
            '</div>';
    } else {
        // تقييم الصلاة في البيت بناءً على نوع الصلاة
        switch(prayerType) {
            case 'fajr':
                recommendations.push('صلاة الفجر في المسجد لها فضل عظيم، فهي من أثقل الصلوات على المنافقين');
                break;
            case 'maghrib':
            case 'isha':
                recommendations.push('يفضل أداء صلاة ' + getPrayerName(prayerType) + ' في المسجد مع الجماعة لعظيم الأجر');
                break;
            case 'dhuhr':
            case 'asr':
                recommendations.push('حاول الحرص على صلاة الجماعة في المسجد ما استطعت إلى ذلك سبيلا');
                break;
        }

        resultMessage = '<div class="alert alert-info">' +
            '<h4>تذكير 📝</h4>' +
            '<p>صلاة الجماعة في المسجد أفضل من صلاة الفرد، لكن الصلاة في البيت جائزة عند الحاجة</p>' +
            '</div>';
    }

    // عرض النتائج
    const resultSection = document.getElementById('evaluationResult');
    const resultDetails = document.getElementById('resultDetails');
    const recommendationsElement = document.getElementById('recommendations');

    resultDetails.innerHTML = resultMessage;
    
    if (recommendations.length > 0) {
        recommendationsElement.innerHTML = '<div class="alert alert-warning">' +
            '<h5>توصيات:</h5>' +
            '<ul class="list-unstyled mb-0">' +
            recommendations.map(rec => `<li>• ${rec}</li>`).join('') +
            '</ul></div>';
    } else {
        recommendationsElement.innerHTML = '';
    }

    resultSection.style.display = 'block';
});

// دالة مساعدة للحصول على اسم الصلاة بالعربية
function getPrayerName(prayerType) {
    const prayerNames = {
        'fajr': 'الفجر',
        'dhuhr': 'الظهر',
        'asr': 'العصر',
        'maghrib': 'المغرب',
        'isha': 'العشاء'
    };
    return prayerNames[prayerType];
}

// وظيفة لتخزين بيانات الصلاة
function savePrayerData(prayerType, location) {
    const date = new Date();
    const prayerData = {
        date: date.toISOString(),
        type: prayerType,
        location: location,
        year: date.getFullYear(),
        month: date.getMonth(),
        week: getWeekNumber(date),
        day: date.getDay()
    };

    // جلب البيانات المخزنة سابقاً
    let prayers = JSON.parse(localStorage.getItem('prayerData')) || [];
    prayers.push(prayerData);
    localStorage.setItem('prayerData', JSON.stringify(prayers));
}

// دالة لحساب رقم الأسبوع في السنة
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// دالة لتحليل بيانات الصلاة
function analyzePrayerData() {
    const prayers = JSON.parse(localStorage.getItem('prayerData')) || [];
    const today = new Date();
    
    // إحصائيات اليوم
    const todayPrayers = prayers.filter(p => {
        const pDate = new Date(p.date);
        return pDate.toDateString() === today.toDateString();
    });

    // إحصائيات الأسبوع
    const thisWeek = getWeekNumber(today);
    const weekPrayers = prayers.filter(p => p.week === thisWeek && p.year === today.getFullYear());

    // إحصائيات الشهر
    const monthPrayers = prayers.filter(p => {
        const pDate = new Date(p.date);
        return pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
    });

    return {
        today: calculateStats(todayPrayers),
        week: calculateStats(weekPrayers),
        month: calculateStats(monthPrayers),
        all: calculateStats(prayers)
    };
}

// دالة لحساب الإحصائيات
function calculateStats(prayers) {
    const total = prayers.length;
    const mosque = prayers.filter(p => p.location === 'mosque').length;
    const home = prayers.filter(p => p.location === 'home').length;
    
    return {
        total,
        mosque,
        home,
        mosquePercentage: total ? ((mosque / total) * 100).toFixed(1) : 0
    };
}

document.getElementById('prayerEvaluationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const prayerType = document.getElementById('prayerType').value;
    const prayerLocation = document.querySelector('input[name="prayerLocation"]:checked').value;

    // حفظ بيانات الصلاة
    savePrayerData(prayerType, prayerLocation);

    let resultMessage = '';
    let recommendations = [];

    if (prayerLocation === 'mosque') {
        resultMessage = '<div class="alert alert-success">' +
            '<h4>أحسنت! 🌟</h4>' +
            '<p>صلاة الجماعة في المسجد أفضل من صلاة الفرد بسبع وعشرين درجة</p>' +
            '</div>';
    } else {
        switch(prayerType) {
            case 'fajr':
                recommendations.push('صلاة الفجر في المسجد لها فضل عظيم، فهي من أثقل الصلوات على المنافقين');
                break;
            case 'maghrib':
            case 'isha':
                recommendations.push('يفضل أداء صلاة ' + getPrayerName(prayerType) + ' في المسجد مع الجماعة لعظيم الأجر');
                break;
            case 'dhuhr':
            case 'asr':
                recommendations.push('حاول الحرص على صلاة الجماعة في المسجد ما استطعت إلى ذلك سبيلا');
                break;
        }

        resultMessage = '<div class="alert alert-info">' +
            '<h4>تذكير 📝</h4>' +
            '<p>صلاة الجماعة في المسجد أفضل من صلاة الفرد، لكن الصلاة في البيت جائزة عند الحاجة</p>' +
            '</div>';
    }

    const resultSection = document.getElementById('evaluationResult');
    const resultDetails = document.getElementById('resultDetails');
    const recommendationsElement = document.getElementById('recommendations');

    resultDetails.innerHTML = resultMessage;
    
    if (recommendations.length > 0) {
        recommendationsElement.innerHTML = '<div class="alert alert-warning">' +
            '<h5>توصيات:</h5>' +
            '<ul class="list-unstyled mb-0">' +
            recommendations.map(rec => `<li>• ${rec}</li>`).join('') +
            '</ul></div>';
    } else {
        recommendationsElement.innerHTML = '';
    }

    resultSection.style.display = 'block';

    // تحديث الإحصائيات إذا كنا في صفحة لوحة التحكم
    if (window.updateDashboard) {
        window.updateDashboard();
    }
});

// Function to show login form
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('recoveryForm').style.display = 'none';
    document.getElementById('newPasswordForm').style.display = 'none';
}

// Function to show register form
function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('recoveryForm').style.display = 'none';
    document.getElementById('newPasswordForm').style.display = 'none';
}

// Function to show recovery form
function showRecoveryForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('recoveryForm').style.display = 'block';
    document.getElementById('newPasswordForm').style.display = 'none';
}

// Function to show new password form
function showNewPasswordForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('recoveryForm').style.display = 'none';
    document.getElementById('newPasswordForm').style.display = 'block';
}

// تخزين بيانات المستخدمين ورموز التحقق
let users = JSON.parse(localStorage.getItem('users')) || [];
let verificationCodes = {};

// دالة لإرسال رمز التحقق عبر البريد الإلكتروني
async function sendVerificationEmail(email, verificationCode) {
    try {
        const templateParams = {
            to_email: email,
            verification_code: verificationCode,
            to_name: users.find(u => u.email === email)?.fullName || 'المستخدم'
        };

        // إرسال البريد الإلكتروني باستخدام EmailJS
        const response = await emailjs.send(
            'YOUR_SERVICE_ID', // معرف الخدمة من EmailJS
            'YOUR_TEMPLATE_ID', // معرف القالب من EmailJS
            templateParams
        );

        if (response.status === 200) {
            alert('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
            return true;
        } else {
            throw new Error('فشل في إرسال البريد الإلكتروني');
        }
    } catch (error) {
        console.error('خطأ في إرسال البريد الإلكتروني:', error);
        alert('حدث خطأ في إرسال رمز التحقق. الرجاء المحاولة مرة أخرى');
        return false;
    }
}

// معالجة طلب استعادة كلمة المرور
document.getElementById('passwordRecoveryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('recoveryEmail').value;
    const user = users.find(u => u.email === email);

    if (user) {
        // إنشاء رمز تحقق عشوائي
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // محاولة إرسال رمز التحقق عبر البريد الإلكتروني
        const emailSent = await sendVerificationEmail(email, verificationCode);
        
        if (emailSent) {
            verificationCodes[email] = {
                code: verificationCode,
                timestamp: new Date().getTime()
            };

            // عرض نموذج تعيين كلمة المرور الجديدة
            document.getElementById('recoveryForm').style.display = 'none';
            document.getElementById('newPasswordForm').style.display = 'block';
        }
    } else {
        alert('البريد الإلكتروني غير مسجل في النظام');
    }
});

// معالجة تعيين كلمة المرور الجديدة
document.getElementById('setNewPasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const verificationCode = document.getElementById('verificationCode').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const recoveryEmail = document.getElementById('recoveryEmail').value;

    // التحقق من تطابق كلمة المرور
    if (newPassword !== confirmNewPassword) {
        alert('كلمة المرور غير متطابقة');
        return;
    }

    // التحقق من صحة رمز التحقق وصلاحيته
    const storedVerification = verificationCodes[recoveryEmail];
    if (!storedVerification || storedVerification.code !== verificationCode) {
        alert('رمز التحقق غير صحيح');
        return;
    }

    // التحقق من صلاحية الرمز (30 دقيقة)
    const currentTime = new Date().getTime();
    if (currentTime - storedVerification.timestamp > 30 * 60 * 1000) {
        alert('انتهت صلاحية رمز التحقق');
        return;
    }

    // تحديث كلمة المرور
    const userIndex = users.findIndex(u => u.email === recoveryEmail);
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
        
        // حذف رمز التحقق المستخدم
        delete verificationCodes[recoveryEmail];

        alert('تم تغيير كلمة المرور بنجاح');
        toggleForms('login');
    }
});

// معالجة تسجيل حساب جديد
document.getElementById('userRegisterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('regFullName').value;
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // التحقق من تطابق كلمة المرور
    if (password !== confirmPassword) {
        alert('كلمة المرور غير متطابقة');
        return;
    }

    // التحقق من عدم وجود اسم المستخدم مسبقاً
    if (users.some(user => user.username === username)) {
        alert('اسم المستخدم موجود مسبقاً');
        return;
    }

    // إضافة المستخدم الجديد
    const newUser = {
        fullName,
        username,
        email,
        password // في التطبيق الحقيقي يجب تشفير كلمة المرور
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول
    alert('تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول');
    toggleForms('login');
    document.getElementById('userRegisterForm').reset();
});

// معالجة تسجيل الدخول
document.getElementById('userLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // البحث عن المستخدم في قائمة المستخدمين
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // تخزين معلومات المستخدم في الجلسة
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // إخفاء نموذج تسجيل الدخول
        document.getElementById('loginForm').style.display = 'none';
        // إظهار محتوى التقييم
        document.getElementById('prayerContent').style.display = 'block';
    } else {
        alert('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
});

function getPrayerName(prayerType) {
    const prayerNames = {
        'fajr': 'الفجر',
        'dhuhr': 'الظهر',
        'asr': 'العصر',
        'maghrib': 'المغرب',
        'isha': 'العشاء'
    };
    return prayerNames[prayerType];
}

// التحقق من تسجيل الدخول وإعداد الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = userManagement.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }

    // عرض اسم المستخدم
    document.getElementById('userNameDisplay').textContent = currentUser.fullName;

    // إظهار/إخفاء خيارات الرجال بناءً على جنس المستخدم
    const maleOptions = document.getElementById('maleOptions');
    const mosqueLocInput = document.getElementById('mosqueLoc');
    const homeLocInput = document.getElementById('homeLoc');

    if (currentUser.gender === 'male') {
        maleOptions.style.display = 'block';
        mosqueLocInput.required = true;
    } else {
        maleOptions.style.display = 'none';
        mosqueLocInput.required = false;
        homeLocInput.required = false;
    }

    // تعيين التاريخ الحالي
    const today = new Date();
    document.getElementById('prayerDate').value = today.toISOString().split('T')[0];
    updatePrayerDay();
});

// معالجة تقييم الصلاة
document.getElementById('prayerEvaluationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const currentUser = userManagement.getCurrentUser();
    const prayerDate = document.getElementById('prayerDate').value;
    const prayerDay = document.getElementById('prayerDay').value;
    const prayerType = document.getElementById('prayerType').value;
    const timing = document.querySelector('input[name="prayerTiming"]:checked').value;
    
    // تحديد مكان الصلاة بناءً على جنس المستخدم
    let location = 'home'; // افتراضي للنساء
    if (currentUser.gender === 'male') {
        location = document.querySelector('input[name="prayerLocation"]:checked').value;
    }

    // حساب التقييم
    const rating = location === 'mosque' ? 10 : 5;

    // حفظ التقييم
    const evaluation = {
        userId: currentUser.id,
        prayerDate,
        prayerDay,
        prayerType,
        timing,
        location,
        rating,
        timestamp: new Date().toISOString()
    };

    // تخزين التقييم في localStorage
    const evaluations = JSON.parse(localStorage.getItem('prayerEvaluations')) || [];
    evaluations.push(evaluation);
    localStorage.setItem('prayerEvaluations', JSON.stringify(evaluations));

    alert('تم حفظ التقييم بنجاح');
    this.reset();
    
    // إعادة تعيين التاريخ واليوم
    const today = new Date();
    document.getElementById('prayerDate').value = today.toISOString().split('T')[0];
    updatePrayerDay();
});