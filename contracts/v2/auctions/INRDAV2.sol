/**
* Minimal interface definition for NRDA V2 contract calls
*
* https://www.notreal.ai/
*/
interface INRDAV2 {
  function mint(address _to, uint256 _editionNumber) external returns (uint256);

  function editionExists(uint256 _editionNumber) external returns (bool);

  function totalRemaining(uint256 _editionNumber) external view returns (uint256);

  function artistCommission(uint256 _editionNumber) external view returns (address _artistAccount, uint256 _artistCommission);

  function editionOptionalCommission(uint256 _editionNumber) external view returns (uint256 _rate, address _recipient);
}
