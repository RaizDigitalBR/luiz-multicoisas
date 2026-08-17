import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const telaLogin = document.getElementById("telaLogin");
const painel = document.getElementById("painel");
const emailLogin = document.getElementById("emailLogin");
const senhaLogin = document.getElementById("senhaLogin");
const btnEntrar = document.getElementById("btnEntrar");
const btnNovaVenda = document.getElementById("btnNovaVenda");
const btnNovaDespesa = document.getElementById("btnNovaDespesa");
const listaEl = document.getElementById("listaMovimentacoes");
const saldoDiaEl = document.getElementById("saldoDia");
const totalVendasEl = document.getElementById("totalVendas");
const totalDespesasEl = document.getElementById("totalDespesas");

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// --- LOGIN ---
btnEntrar.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailLogin.value.trim(), senhaLogin.value);
  } catch (erro) {
    alert("Não foi possível entrar. Confere e-mail e senha.");
    console.error(erro);
  }
});

onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    telaLogin.classList.add("oculto");
    painel.classList.remove("oculto");
    carregarMovimentacoes();
  } else {
    telaLogin.classList.remove("oculto");
    painel.classList.add("oculto");
  }
});

// --- REGISTRAR VENDA / DESPESA (esboço — modal simples via prompt por enquanto) ---
btnNovaVenda.addEventListener("click", () => registrar("venda"));
btnNovaDespesa.addEventListener("click", () => registrar("despesa"));

async function registrar(tipo) {
  const descricao = prompt(tipo === "venda" ? "O que foi vendido?" : "Qual foi a despesa?");
  if (!descricao) return;
  const valorTexto = prompt("Valor (R$):");
  const valor = parseFloat((valorTexto || "0").replace(",", "."));
  if (!valor || valor <= 0) {
    alert("Valor inválido.");
    return;
  }

  const colecao = tipo === "venda" ? "vendas" : "despesas";
  await addDoc(collection(db, colecao), {
    descricao,
    valor,
    criadoEm: serverTimestamp()
  });
}

// --- CARREGAR E CALCULAR ---
function carregarMovimentacoes() {
  const vendasQuery = query(collection(db, "vendas"), orderBy("criadoEm", "desc"));
  const despesasQuery = query(collection(db, "despesas"), orderBy("criadoEm", "desc"));

  let vendas = [];
  let despesas = [];

  onSnapshot(vendasQuery, (snap) => {
    vendas = snap.docs.map((d) => ({ id: d.id, tipo: "venda", ...d.data() }));
    atualizarTela(vendas, despesas);
  });

  onSnapshot(despesasQuery, (snap) => {
    despesas = snap.docs.map((d) => ({ id: d.id, tipo: "despesa", ...d.data() }));
    atualizarTela(vendas, despesas);
  });
}

function atualizarTela(vendas, despesas) {
  const totalVendas = vendas.reduce((soma, v) => soma + (v.valor || 0), 0);
  const totalDespesas = despesas.reduce((soma, d) => soma + (d.valor || 0), 0);
  const saldo = totalVendas - totalDespesas;

  totalVendasEl.textContent = formatarMoeda(totalVendas);
  totalDespesasEl.textContent = formatarMoeda(totalDespesas);
  saldoDiaEl.textContent = formatarMoeda(saldo);
  saldoDiaEl.className = "valor " + (saldo >= 0 ? "positivo" : "negativo");

  const todas = [...vendas, ...despesas].sort((a, b) => {
    const ta = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0;
    const tb = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
    return tb - ta;
  });

  listaEl.innerHTML = todas.slice(0, 15).map((item) => `
    <div class="item-lista">
      <div>
        <div class="desc">${item.descricao}</div>
        <div class="data">${item.tipo === "venda" ? "Venda" : "Despesa"}</div>
      </div>
      <div class="valor ${item.tipo}">${item.tipo === "despesa" ? "-" : "+"}${formatarMoeda(item.valor)}</div>
    </div>
  `).join("");
}
