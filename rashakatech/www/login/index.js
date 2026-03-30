frappe.ready(function () {
    const form = document.getElementById('login-form');
    const btn = document.getElementById('login-btn');
    const msg = document.getElementById('login-msg');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        btn.classList.add('loading');
        btn.disabled = true;
        msg.textContent = '';

        try {
            const res = await frappe.call({
                method: 'login',
                args: { usr: email, pwd: password }
            });

            if (res.message === 'Logged In') {
                btn.innerHTML = '<span class="btn-icon">✓</span> تم الدخول';
                btn.style.background = 'linear-gradient(135deg, #00ff88, #00cc66)';
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 800);
            }
        } catch (err) {
            msg.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            msg.className = 'msg error';
            btn.classList.remove('loading');
            btn.disabled = false;
            shakeForm();
        }
    });

    function shakeForm() {
        const card = document.querySelector('.login-card');
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 500);
    }
});
