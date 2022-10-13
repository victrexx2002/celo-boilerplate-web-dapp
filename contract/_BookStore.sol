// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}
contract BookPlace {


    uint internal booksLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    struct Book {
        address payable owner;
        string name;
        string image;
        string description;
        string author;
        uint price;
        //uint copies;
        uint sold;

    }
    mapping (uint => Book) internal books;


    function writeBook(
        string memory _name,
        string memory _image,
        string memory _description,
        string memory _author,
        uint _price
        // uint _copies //copies available,
        
        ) public {
            uint _sold = 0;
            books[booksLength]=Book(
                payable(msg.sender),
                _name,
                _image,
                _description,
                _author,
                _price,
                //_copies,
                _sold
            );
            booksLength++;
    }


    function readBook(uint _index) public view returns (
        address payable,
        string memory,
        string memory,
        string memory,
        string memory,
        uint,
        uint
    ){
        return( 
        books[_index].owner,
        books[_index].name,
        books[_index].image,
        books[_index].description,
        books[_index].author,
        books[_index].price,
        books[_index].sold
        );
    }

    function buyBook(uint _index) public payable {
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                books[_index].owner,
                books[_index].price
            ),
            "TRANSFER FAILED"
        );
        books[_index].sold++;
        // books[_index].copies--;
    }
    // //Reserve a book for a tenth of the price
    // function reserveBook(uint _index) public payable {
    //     require(
    //         IERC20Token(cUsdTokenAddress).transferFrom(
    //             msg.sender,
    //             books[_index].owner,
    //             books[_index].price/10
    //         ),
    //         "RESERVE FAILED"
    //     );
    //     books[_index].copies--;
    // }
    //function for the buyer to get reserved books once they connect their wallet..
    // I want to get all the reserved books in an array then when connected display all of them


    function getBooksLength() public view returns (uint) {
        return (booksLength);
    }
}
