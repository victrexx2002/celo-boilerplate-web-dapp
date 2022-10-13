// const { WrapperCache } = require("@celo/contractkit/lib/contract-cache");
import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import BookPlaceAbi from '../contract/bookstore.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18;
const MPContractAddress = "0xD059e111d50429177A4a6082646341d7fe41CdDc";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
let kit;
let contract;
let books = [];

const connectCeloWallet = async function () {
  if (window.celo) {
      notify("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notifyRest()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(BookPlaceAbi, MPContractAddress);


    } catch (error) {
      notify(`⚠️ ${error}.`)
    }
  } else {
    notifyRest("⚠️ Please install the CeloExtensionWallet.")
  }
}

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(MPContractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}

const showWorth = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}

const getBooks = async function() {
  const _booksLength = await contract.methods.getBooksLength().call()
  const _books = []
  for (let i = 0; i < _booksLength; i++) {
    let _book = new Promise(async (resolve, reject) => {
      let b = await contract.methods.readBook(i).call()
      resolve({
        index: i,
        owner: b[0],
        name: b[1],
        image: b[2],
        description: b[3],
        author: b[4],
        price: new BigNumber(b[5]),
        sold: b[6],
      })
    })
    _books.push(_book);
  }
  books = await Promise.all(_books);
  displayBooks();
}

const displayBooks = function () {
  document.getElementById('book-store').innerHTML = '';
  books.forEach((_book) =>{
      const newDiv = document.createElement('div');
      newDiv.className = 'col-md-4'
      newDiv.innerHTML = illustration(_book)
      document.getElementById('book-store').appendChild(newDiv);
  })
} 

function illustration(_book){
  return `
  <div class="deck-wrapper col mb-4">
      <div class="deck-top">
          <img class='imageseen' src="${_book.image}" alt="book">
      </div>
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
                ${_book.sold} Sold
      </div>
      <div class="translate-middle-y position-absolute top-4">
          ${identiconTemplate(_book.owner)}
      </div>
      <div class="deck-bottom">
          <span class="top-text">${_book.name}</span><br>
          <span class="bottom-text">
              <p> ${_book.description}</p>
              <p class="card-text mt-4">
                  <i class="bi"></i>
                  <span>${_book.author}</span>
              </p>
          </span>
          <br>
          <button class="button" id="${_book.index}">Buy for ${_book.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD</button>
      </div>
  </div>
`
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}

function notify(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notifyRest() {
  document.querySelector(".alert").style.display = "none"
}

window.addEventListener("load", async () => {
  notify("⌛ Loading...");
  await connectCeloWallet();
  await showWorth();
  await getBooks();
  notifyRest()
})

document
.querySelector("#newBook")
.addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newBookName").value,
    document.getElementById("newImgUrl").value,
    document.getElementById("newBookDescription").value,
    document.getElementById("newBookAuthor").value,
    new BigNumber(document.getElementById("newPrice").value)
    .shiftedBy(ERC20_DECIMALS).toString()
  ]
  notify(`🎉 Adding ${params[0]}...`)
  try {
    const result = await contract.methods
      .writeBook(...params)
      .send({ from: kit.defaultAccount })
  } catch (error) {
    notify(`⚠️ ${error}.`)
  }
  notify(`🎉 You successfully added "${params[0]}".`)
  getBooks();
})

document.querySelector("#book-store").addEventListener("click", async (o) => {
  if(o.target.className.includes("buyBtn")) {
    const index = o.target.id
    notify(`⌛ Waiting for payment approval....`)
    try {
      await approve(books[index].price)
    } catch (error) {
      notify(`${error}.`)
    }
    notify(`⌛ Awaiting payment for "${books[index].name}"...`)
    try {
      const result = await contract.methods
        .buyBook(index)
        .send({ from: kit.defaultAccount })
      notify(`🎉 You successfully bought "${books[index].name}".`)
      getBooks()
      showWorth()
    } catch (error) {
      notify(`⚠️ ${error}.`)
    }
  }
})