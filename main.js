// Struktur Data Global
const transactions = [];
const STORAGE_KEY = 'EXPENSE_TRACKER_DATA';
const RENDER_EVENT = 'render-transaction';

// Variabel untuk melacak status edit
let editingId = null;

// ============================================================================
// 1. WEB STORAGE API
// ============================================================================

function isStorageExist() {
  if (typeof (Storage) === undefined) {
    alert('Browser kamu tidak mendukung local storage');
    return false;
  }
  return true;
}

function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(transactions);
    localStorage.setItem(STORAGE_KEY, parsed);
    document.dispatchEvent(new Event(RENDER_EVENT));
  }
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  let data = JSON.parse(serializedData);

  if (data !== null) {
    for (const transaction of data) {
      transactions.push(transaction);
    }
  }
  document.dispatchEvent(new Event(RENDER_EVENT));
}

// ============================================================================
// 2. MANIPULASI DOM & EVENT HANDLERS
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
  const greetingElement = document.querySelector('.tracker-header__greeting');
  if (greetingElement) {
    greetingElement.innerHTML = 'Halo, <strong>SyahdanHaidar (SYN007)</strong>'; 
  }

  const transactionForm = document.getElementById('transactionForm');
  transactionForm.addEventListener('submit', function (event) {
    event.preventDefault();
    addOrUpdateTransaction();
  });

  const searchInput = document.getElementById('searchTransactionFormTitleInput'); 
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      document.dispatchEvent(new Event(RENDER_EVENT));
    });
  }

  const searchForm = document.getElementById('searchTransactionForm');
  if(searchForm) {
    searchForm.addEventListener('submit', function(event) {
      event.preventDefault();
    });
  }

  if (isStorageExist()) {
    loadDataFromStorage();
  }
});

// ============================================================================
// 3. LOGIKA TRANSAKSI (TAMBAH, UBAH, HAPUS, GANTI TIPE)
// ============================================================================

function addOrUpdateTransaction() {
  const title = document.getElementById('transactionFormTitleInput').value;       
  const amount = Number(document.getElementById('transactionFormAmountInput').value); 
  const date = document.getElementById('transactionFormDateInput').value;         
  const type = document.getElementById('transactionFormTypeSelect').value;         

  if (!title.trim()) {
    alert('Judul transaksi tidak boleh kosong!');
    return;
  }
  if (amount < 1) {
    alert('Nominal uang tidak boleh kurang dari 1 rupiah!');
    return;
  }
  if (!date) {
    alert('Tanggal tidak boleh kosong!');
    return;
  }

  if (editingId !== null) {
    // Mode Update / Edit
    const index = transactions.findIndex(t => t.id === editingId);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], title, amount, date, type };
    }
    editingId = null; 
    document.querySelector('#transactionForm button[type="submit"]').innerText = 'Simpan';
  } else {
    // Mode Tambah Baru
    const newTransaction = {
      id: +new Date(),
      title,
      amount,
      date,
      type
    };
    transactions.push(newTransaction);
  }

  document.getElementById('transactionForm').reset();
  saveData();
}

function deleteTransaction(id) {
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions.splice(index, 1);
    saveData();
  }
}

function changeTransactionType(id) {
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions[index].type = transactions[index].type === 'income' ? 'expense' : 'income';
    saveData();
  }
}

function editTransaction(id) {
  const transaction = transactions.find(t => t.id === id);
  if (transaction) {
    document.getElementById('transactionFormTitleInput').value = transaction.title;
    document.getElementById('transactionFormAmountInput').value = transaction.amount;
    document.getElementById('transactionFormDateInput').value = transaction.date;
    document.getElementById('transactionFormTypeSelect').value = transaction.type;
    
    editingId = id;
    
    const submitBtn = document.querySelector('#transactionForm button[type="submit"]');
    if(submitBtn) submitBtn.innerText = 'Simpan Perubahan';
  }
}

// ============================================================================
// 4. MERENDER TAMPILAN
// ============================================================================

function makeTransactionElement(transaction) {
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'transactionItem');
  container.classList.add('transaction-card'); 

  const titleEl = document.createElement('h3');
  titleEl.setAttribute('data-testid', 'transactionItemTitle');
  titleEl.innerText = transaction.title;

  const amountEl = document.createElement('p');
  amountEl.setAttribute('data-testid', 'transactionItemAmount');
  amountEl.innerText = `Nominal: Rp${transaction.amount}`;

  const dateEl = document.createElement('p');
  dateEl.setAttribute('data-testid', 'transactionItemDate');
  dateEl.innerText = `Tanggal: ${transaction.date}`;

  const typeEl = document.createElement('p');
  typeEl.setAttribute('data-testid', 'transactionItemType');
  typeEl.innerText = `Tipe: ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;

  const actionContainer = document.createElement('div');
  actionContainer.classList.add('transaction-actions'); 

  const changeTypeBtn = document.createElement('button');
  changeTypeBtn.setAttribute('data-testid', 'transactionItemEditTypeButton');
  changeTypeBtn.innerText = 'Ubah Tipe';
  changeTypeBtn.addEventListener('click', () => changeTransactionType(transaction.id));

  const editBtn = document.createElement('button');
  editBtn.innerText = 'Edit';
  editBtn.addEventListener('click', () => editTransaction(transaction.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.setAttribute('data-testid', 'transactionItemDeleteButton');
  deleteBtn.innerText = 'Hapus';
  deleteBtn.addEventListener('click', () => deleteTransaction(transaction.id));

  actionContainer.append(changeTypeBtn, editBtn, deleteBtn);
  container.append(titleEl, amountEl, dateEl, typeEl, actionContainer);

  return container;
}

document.addEventListener(RENDER_EVENT, function () {
  const incomeList = document.getElementById('incomeList');
  const expenseList = document.getElementById('expenseList');
  
  incomeList.innerHTML = '';
  expenseList.innerHTML = '';

  let totalIncome = 0;
  let totalExpense = 0;

  const searchInput = document.getElementById('searchTransactionFormTitleInput');
  const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';

  for (const transaction of transactions) {
    if (transaction.type === 'income') {
      totalIncome += transaction.amount;
    } else {
      totalExpense += transaction.amount;
    }

    if (transaction.title.toLowerCase().includes(searchQuery)) {
      const transactionElement = makeTransactionElement(transaction);
      if (transaction.type === 'income') {
        incomeList.append(transactionElement);
      } else {
        expenseList.append(transactionElement);
      }
    }
  }

  const totalBalanceEl = document.getElementById('totalBalance');
  const totalIncomeEl = document.getElementById('totalIncome');
  const totalExpenseEl = document.getElementById('totalExpense');

  if(totalBalanceEl) totalBalanceEl.innerText = `Rp ${totalIncome - totalExpense}`;
  if(totalIncomeEl) totalIncomeEl.innerText = `Rp ${totalIncome}`;
  if(totalExpenseEl) totalExpenseEl.innerText = `Rp ${totalExpense}`;
});