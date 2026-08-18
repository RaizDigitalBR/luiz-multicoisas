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
const totalDinheiroEl = document.getElementById("totalDinheiro");
const totalPixEl = document.getElementById("totalPix");

// elementos do modal
const modalFundo = document.getElementById("modalFundo");
const modalTitulo = document.getElementById("modalTitulo");
const modalDescricao = document.getElementById("modalDescricao");
const modalValor = document.getElementById("modalValor");
const modalSalvar = document.getElementById("modalSalvar");
const modalFechar = document.getElementById("modalFechar");
const grupoFormaPagamento = document.getElementById("grupoFormaPagamento");
const opcoesPagamento = document.querySelectorAll(".opcao-pagamento");

let tipoAtual = "venda";
let formaPagamentoAtual = "dinheiro";

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

// --- REGISTRAR VENDA / DESPESA (modal) ---
btnNovaVenda.addEventListener("click", () => abrirModal("venda"));
btnNovaDespesa.addEventListener("click", () => abrirModal("despesa"));
modalFechar.addEventListener("click", fecharModal);
modalFundo.addEventListener("click", (evento) => {
  if (evento.target === modalFundo) fecharModal();
});

opcoesPagamento.forEach((botao) => {
  botao.addEventListener("click", () => {
    formaPagamentoAtual = botao.dataset.forma;
    opcoesPagamento.forEach((b) => b.classList.remove("selecionada"));
    botao.classList.add("selecionada");
  });
});

function abrirModal(tipo) {
  tipoAtual = tipo;
  modalTitulo.textContent = tipo === "venda" ? "Nova venda" : "Nova despesa";
  modalDescricao.value = "";
  modalValor.value = "";
  formaPagamentoAtual = "dinheiro";
  opcoesPagamento.forEach((b) => b.classList.toggle("selecionada", b.dataset.forma === "dinheiro"));

  // forma de pagamento só faz sentido pra venda (o que entrou em dinheiro ou pix)
  grupoFormaPagamento.classList.toggle("oculto", tipo !== "venda");

  modalFundo.classList.remove("oculto");
  modalDescricao.focus();
}

function fecharModal() {
  modalFundo.classList.add("oculto");
}

modalSalvar.addEventListener("click", async () => {
  const descricao = modalDescricao.value.trim();
  const valor = parseFloat((modalValor.value || "0").replace(",", "."));

  if (!descricao) {
    alert("Descreve o que foi.");
    return;
  }
  if (!valor || valor <= 0) {
    alert("Valor inválido.");
    return;
  }

  const colecao = tipoAtual === "venda" ? "vendas" : "despesas";
  const dados = {
    descricao,
    valor,
    criadoEm: serverTimestamp()
  };
  if (tipoAtual === "venda") {
    dados.formaPagamento = formaPagamentoAtual; // "dinheiro" ou "pix"
  }

  modalSalvar.disabled = true;
  try {
    await addDoc(collection(db, colecao), dados);
    fecharModal();
  } catch (erro) {
    alert("Não foi possível salvar. Tenta de novo.");
    console.error(erro);
  } finally {
    modalSalvar.disabled = false;
  }
});

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

  const totalDinheiro = vendas
    .filter((v) => v.formaPagamento === "dinheiro")
    .reduce((soma, v) => soma + (v.valor || 0), 0);
  const totalPix = vendas
    .filter((v) => v.formaPagamento === "pix")
    .reduce((soma, v) => soma + (v.valor || 0), 0);

  totalVendasEl.textContent = formatarMoeda(totalVendas);
  totalDespesasEl.textContent = formatarMoeda(totalDespesas);
  totalDinheiroEl.textContent = formatarMoeda(totalDinheiro);
  totalPixEl.textContent = formatarMoeda(totalPix);
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
        <div class="data">
          ${item.tipo === "venda" ? "Venda" : "Despesa"}
          ${item.formaPagamento ? `<span class="tag-pagamento">${item.formaPagamento === "pix" ? "Pix" : "Dinheiro"}</span>` : ""}
        </div>
      </div>
      <div class="valor ${item.tipo}">${item.tipo === "despesa" ? "-" : "+"}${formatarMoeda(item.valor)}</div>
    </div>
  `).join("");
}