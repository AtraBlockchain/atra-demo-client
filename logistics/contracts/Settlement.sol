pragma solidity ^0.5.11;
pragma experimental ABIEncoderV2;

interface IOrders {
  struct Data {
    string A_OrderID;
    string A_Description;
    uint256 A_ExpectedDeliveryDate;
    uint256 A_Price;
    address payable A_Buyer;
    uint256 A_Date;
  }
  function GetById(address recordId) external returns(uint256,IOrders.Data memory);
  function Exists(address recordId) external returns(bool);
}

interface IOrderStateLogs {
  struct Data {
    string A_State;
    string A_Condition;
    string A_Full;
    uint A_Date;
    address A_Orders_Pointer;
  }
  struct Record {
    Data data;
    uint idListPointer;
  }
  function GetById(address recordId) external returns(uint index, Data memory record ,IOrders.Data memory R_Orders_Data);
  function Exists(address recordId) external returns(bool);
}

contract OrderSettlement {

    address OrderStateLogTableAddress;
    address payable Seller;
    address public Buyer;

    event LogData(IOrders.Data order, IOrderStateLogs.Data log);

    //The buyer starts the contract and fills it with ETH

    constructor(address payable _seller, address _orderStateLogTableAddress) public payable {
        OrderStateLogTableAddress = _orderStateLogTableAddress;
        Seller = _seller;
        Buyer = msg.sender;
    }

    function Deposit() public payable { }

    function Balance() public view returns(uint){
        return address(this).balance;
    }

    function CompleteOrder(address _orderStateLogRecordId) public returns(bool _reduced) {

        IOrderStateLogs OrderStateLogTable = IOrderStateLogs(OrderStateLogTableAddress);
        uint index;
        IOrderStateLogs.Data memory log;
        IOrders.Data memory order;
        (index, log, order) = OrderStateLogTable.GetById(_orderStateLogRecordId);

        require(keccak256(abi.encodePacked(log.A_State)) == keccak256(abi.encodePacked("Delivered")));

        emit LogData(order, log);

        bool reduced = SettleOrder(order.A_ExpectedDeliveryDate, log.A_Date, log.A_Condition, log.A_Full);

        // Pay the seller
        if(reduced){
            uint reducedRate = order.A_Price - (order.A_Price  * 5 / 100); // 5% reduced rate
            Seller.transfer(reducedRate);
        }else{
            Seller.transfer(order.A_Price );
        }

        return reduced;

    }

    function SettleOrder(uint _expectedDate, uint deliveredDate, string memory condition, string memory full) internal returns(bool reduced){
        //require order to be in full
        require(keccak256(abi.encodePacked(full)) == keccak256(abi.encodePacked("Full")), 'Delivered-Partial');
        //require order to not be over 1 days late
        require(deliveredDate < (_expectedDate + (24 * 3600000)), 'Delivered-Over-24hr-Late');
        //require order to be in good condition
        require(keccak256(abi.encodePacked(condition)) == keccak256(abi.encodePacked("Good")), 'Delivered-Damaged');

        //if delivery date is gretaer than the expected date (less than 1 day late)
        if(deliveredDate > _expectedDate){
            return false;
        }else{
            //Order is less than expected date (order was delievered ontime);
            return true;
        }
    }

}
