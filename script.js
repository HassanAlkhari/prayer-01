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

// دالة لتحديد مكان الصلاة المختار
function selectLocation(location) {
    document.querySelectorAll('.prayer-location').forEach(el => {
        el.classList.remove('selected');
    });
    
    const selectedLocation = document.querySelector(`#${location}Loc`);
    selectedLocation.checked = true;
    selectedLocation.closest('.prayer-location').classList.add('selected');
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