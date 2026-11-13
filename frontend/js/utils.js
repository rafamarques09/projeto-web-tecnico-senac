/* Utilitários compartilhados: máscaras, validação, feedback e interações comuns. */
(function () {
    const so = (v) => String(v || '').replace(/\D/g, '');
    const U = {
        digitos: so,
        mascaraCPF(v) {
            const d = so(v).slice(0, 11);
            return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
        },
        mascaraTelefone(v) {
            const d = so(v).slice(0, 11);
            if (d.length <= 2) return d.length ? '(' + d : '';
            if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
            if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
            return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
        },
        cpfValido(v) {
            const d = so(v);
            if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
            for (const t of [9, 10]) {
                let s = 0;
                for (let i = 0; i < t; i++) s += Number(d[i]) * (t + 1 - i);
                if ((s * 10) % 11 % 10 !== Number(d[t])) return false;
            }
            return true;
        },
        emailValido: (v) => v.length <= 180 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        senhaValida: (v) => v.length >= 8 && new TextEncoder().encode(v).length <= 72,

        /** Marca/limpa erro de um campo (input com .field pai). */
        erroCampo(input, msg) {
            const campo = input.closest('.field'); const alvo = campo && campo.querySelector('.err');
            input.setAttribute('aria-invalid', msg ? 'true' : 'false');
            if (alvo) alvo.textContent = msg || '';
        },
        carregando(btn, ativo, texto) {
            if (ativo) { btn.dataset.rotulo = btn.querySelector('span').textContent; btn.setAttribute('aria-busy', 'true'); btn.disabled = true; if (texto) btn.querySelector('span').textContent = texto; }
            else { btn.removeAttribute('aria-busy'); btn.disabled = false; if (btn.dataset.rotulo) btn.querySelector('span').textContent = btn.dataset.rotulo; }
        },
        alerta(el, msg, tipo = 'error') {
            el.className = 'alert alert-' + tipo; el.textContent = msg || '';
            if (msg) { el.setAttribute('role', tipo === 'error' ? 'alert' : 'status'); el.scrollIntoView({ block: 'nearest' }); }
        },
        toast(msg, tipo = 'success') {
            let c = document.querySelector('.toasts');
            if (!c) { c = document.createElement('div'); c.className = 'toasts'; c.setAttribute('aria-live', 'polite'); document.body.append(c); }
            const t = document.createElement('div'); t.className = 'toast' + (tipo === 'error' ? ' toast-error' : ''); t.textContent = msg;
            c.append(t); setTimeout(() => t.remove(), 5000);
        },
        icones() {
            const NS = 'http://www.w3.org/2000/svg', mapa = window.ICONES || {};
            document.querySelectorAll('[data-icon]').forEach((el) => {
                const d = mapa[el.dataset.icon]; if (!d) return;
                const svg = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
                svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'currentColor');
                svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
                svg.setAttribute('class', ('icon ' + el.className).trim()); p.setAttribute('d', d); svg.append(p); el.replaceWith(svg);
            });
        },

        iniciarSenha() {
            document.querySelectorAll('[data-toggle-senha]').forEach((b) => b.addEventListener('click', () => {
                const input = document.getElementById(b.dataset.toggleSenha); const mostrar = input.type === 'password';
                input.type = mostrar ? 'text' : 'password';
                b.setAttribute('aria-pressed', String(mostrar)); b.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
            }));
        },
        iniciarMenu() {
            const b = document.querySelector('.nav-toggle'); const nav = document.getElementById('menu'); if (!b || !nav) return;
            const fechar = () => { nav.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); };
            b.addEventListener('click', () => { const abrir = !nav.classList.contains('is-open'); nav.classList.toggle('is-open', abrir); b.setAttribute('aria-expanded', String(abrir)); });
            nav.addEventListener('click', (e) => { if (e.target.closest('a')) fechar(); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
        },
        /** Exibe dados institucionais só quando configurados em js/config.js. */
        aplicarConfig() {
            const inst = (window.CASTRAPET || {}).instituicao || {}; let algum = false;
            document.querySelectorAll('[data-cfg]').forEach((n) => {
                const v = inst[n.dataset.cfg]; n.hidden = !v;
                if (v) { algum = true; n.querySelector('[data-cfg-valor]').textContent = v; }
            });
            const bloco = document.getElementById('contato'); if (bloco) bloco.hidden = !algum;
            if (inst.nome) document.querySelectorAll('[data-cfg-nome]').forEach((n) => { n.textContent = inst.nome; });
        },
        iniciar() {
            U.iniciarSenha(); U.iniciarMenu(); U.aplicarConfig();
            document.querySelectorAll('[data-ano]').forEach((n) => { n.textContent = new Date().getFullYear(); });
            U.icones();
        }
    };
    window.U = U;
    document.addEventListener('DOMContentLoaded', () => U.iniciar());
    window.addEventListener('load', U.icones);
})();
