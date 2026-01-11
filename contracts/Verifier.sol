// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 21051027028534292589651719977609922229122611070584335784760578650992960161422;
    uint256 constant alphay  = 14019391315860868463717565441375005611108332702794970644824746893678636637837;
    uint256 constant betax1  = 6781857791187697997607613965613457566792056251683472347360548662906580869859;
    uint256 constant betax2  = 3695257199749194482602926844019744878247685115915719654423782207677831699034;
    uint256 constant betay1  = 5933370569677708285131965020646663996755946819192078429097529833673011556659;
    uint256 constant betay2  = 4828489683440084463805518467360094849895987999531459915079678923283499950878;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 9152384277615508300254645750271864830152260508047061899878614235797753915895;
    uint256 constant deltax2 = 9192177589574599357778084085976226994766555129554064669597570286641584767679;
    uint256 constant deltay1 = 21574006896335494550569937532750432637315275180809828408008411602155187875122;
    uint256 constant deltay2 = 15187808001609261696764188783145092334185018056546630200093723487870239100124;

    
    uint256 constant IC0x = 2149072200945825971634539904218965279778160505406174960630649266423420913110;
    uint256 constant IC0y = 4783409482436958405313358375571755404120607654902209767119452073200592132328;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    // Proof structure for easier integration
    struct Proof {
        uint[2] a;
        uint[2][2] b;
        uint[2] c;
    }

    // Public function with original signature (for backward compatibility)
    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[1] calldata _pubSignals) public view returns (bool) {
        uint[2] memory pA = _pA;
        uint[2][2] memory pB = _pB;
        uint[2] memory pC = _pC;
        uint[1] memory pubSignals = _pubSignals;
        return _verifyProofInternal(pA, pB, pC, pubSignals);
    }

    // Wrapper function that accepts Proof struct and uint[] for public inputs
    function verifyProof(Proof memory proof, uint[] memory publicInputs) public view returns (bool) {
        require(publicInputs.length == 1, "Invalid public inputs length");
        uint[1] memory pubSignals;
        pubSignals[0] = publicInputs[0];
        return _verifyProofInternal(proof.a, proof.b, proof.c, pubSignals);
    }

    // Internal function with original signature
    function _verifyProofInternal(uint[2] memory _pA, uint[2][2] memory _pB, uint[2] memory _pC, uint[1] memory _pubSignals) internal view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                

                // -A
                mstore(_pPairing, mload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, mload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), mload(pB))
                mstore(add(_pPairing, 96), mload(add(pB, 32)))
                mstore(add(_pPairing, 128), mload(add(pB, 64)))
                mstore(add(_pPairing, 160), mload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), mload(pC))
                mstore(add(_pPairing, 608), mload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
