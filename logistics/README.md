# DEMO SETUP
Step 1. [console] Create dTable to hold Orders

- [text] OrderID
- [text] Description
- [date] ExpectedDeliveryDate
- [price] Price
- [address] Buyer
- [date] Date

Step 2. [console] Create dTable to hold OrderStateLogs

- [text] State
- [text] Condition
- [text] Full
- [date] Date

- [Pointer] Orders Table

Step 3. [remix] Deploy Settlement Contract (Seller_Address, OrderStateLog_Table_Address)

- [metamask] Use Klaus MetaMask to Deploy Contract
- Set Deploy Value to 0.1 ETH
- [console] Get OrderStateLogs Table Address from the console
- Click Deploy


Step 4. [atom] Copy Address from Remix and Set variables in config file

Step 5. [terminal] Run scripts 1-3 (order, pack, ship)

Step 6. [terminal] Run 4_settle_orders

- Open Email Account to show Alerts

- Open MetaMask to show Sellers balance increase
