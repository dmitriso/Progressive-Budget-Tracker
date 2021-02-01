let db;
// CREATE A NEW DB REQUEST FOR A "BUDGET" DATABASE.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
  //  CREATE OBJECT STORE CALLED "PENDING" AND SET autoIncrement TO TRUE
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;

  // CHECK IF APP IS ONLINE BEFORE READING FROM DB
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
  // CREATE A TRANSACTION ON THE PENDING DB WITH readwrite ACCESS
  const transaction = db.transaction(["pending"], "readwrite");

  // ACCESS YOUR PENDING OBJECT STORE
  const store = transaction.objectStore("pending");

  // ADD RECORD TO YOUR STORE WITH ADD METHOD
  store.add(record);
}

function checkDatabase() {
  // OPEN A TRANSACTION ON YOUR PENDING DB
  const transaction = db.transaction(["pending"], "readwrite");
  // ACCESS YOUR PENDING OBJECT STORE 
  const store = transaction.objectStore("pending");
  // GET ALL RECORDS FROM STORE AND SET TO A VARIABLE
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        // IF SUCCESSFULE, OPEN A TRANSACTION ON YOUR PENDING DB
        const transaction = db.transaction(["pending"], "readwrite");

        // ACCESS YOUR PENDING OBJECT STORE
        const store = transaction.objectStore("pending");

        // CLEAR ALL ITEMS IN YOUR STORE
        store.clear();
      });
    }
  };
}

// LISTEN FOR APP COMING BACK ONLINE
window.addEventListener("online", checkDatabase);
