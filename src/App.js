import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import * as s from "./styles/globalStyles";
import styled from "styled-components";
import i11 from "./assets/images/aaaa.png";
import i90 from "./assets/images/9099.png";
import i97 from "./assets/images/97.png";

const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;

export const StyledButton = styled.button`
  padding: 10px;
  border-radius: 50px;
  border: none;
  background-color: var(--secondary);
  padding: 10px;
  font-weight: bold;
  color: var(--secondary-text);
  width: 200px;
  cursor: pointer;
  box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  :hover {
    box-shadow: none;
    -webkit-box-shadow: 0px 4px 0px 1px rgba(0, 0, 0, 1);
    -moz-box-shadow: none;
  }
`;

export const StyledRoundButton = styled.button`
  padding: 10px;
  border-radius: 100%;
  border: none;
  background-color: var(--primary);
  padding: 10px;
  font-weight: bold;
  font-size: 15px;
  color: var(--primary-text);
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`;

export const Gallery = styled.div`
  height: 0px;
  position: fixed;
  margin-bottom: 0px;

  .photobanner {
    position: fixed;
    top: 0px;
    right: 0px;
    overflow: hidden;
    white-space: nowrap;
    animation: bannermove 60s linear infinite alternate;

    &:hover {
      animation-play-state: ;
    }
  }

  .photobanner img {
    height: 200px;
    margin: 0 .0em;
  }

  @keyframes bannermove {
    70% {
      transform: translate( -50%, 0);
    }
    70% {
      transform: translate( 50%, 0);
    }
  }
`;

export const ResponsiveWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: stretched;
  align-items: stretched;
  width: 100%;
  @media (min-width: 767px) {
    flex-direction: row;
  }
`;

export const StyledImg4 = styled.img`
border-radius: 20px;
color: #ffffff;
cursor: pointer;
box-shadow: 2px 8px 4px -2px rgba(100, 0, 250, 0.0);
-webkit-box-shadow: 2px 3px 10px -2px rgba(100, 0, 250, 0);
-moz-box-shadow: 2px 8px 4px -2px rgba(100, 0, 250, 0.0);
:active {
  box-shadow: none;
  -webkit-box-shadow: none;
  -moz-box-shadow: none;
}
:hover {
  -webkit-box-shadow: 2px 3px 20px -2px rgba(250, 250, 0, 0.0);
}
`;

export const StyledLogo = styled.img`
  width: 200px;
  @media (min-width: 767px) {
    width: 300px;
  }
  transition: width 0.5s;
  transition: height 0.5s;
`;

export const StyledImg = styled.img`
  box-shadow: 0px 5px 11px 2px rgba(0, 0, 0, 0.7);
  border: 4px dashed var(--secondary);
  background-color: var(--accent);
  border-radius: 100%;
  width: 200px;
  @media (min-width: 900px) {
    width: 250px;
  }
  @media (min-width: 1000px) {
    width: 300px;
  }
  transition: width 0.5s;
`;

export const StyledLink = styled.a`
  color: var(--secondary);
  text-decoration: none;
  :hover {
    box-shadow: none;
    -webkit-box-shadow: 1px 1px 1px 1px rgba(0, 0, 0, 1);
    -moz-box-shadow: none;
`;

function App() {

  const [whiteListAddr, setWhiteListAddr] = useState([]);
  const [cPaused, setCPaused] = useState(false);
  const [whitelistMint, setWhitelistMint] = useState(false);
  const [whitelistClaimed, setWhitelistClaimed] = useState(0);
  const [maxmintAmount, setMaxMintAmount] = useState(1);
  const [userWhitelist, setUserWhitelist] = useState({proof: [], isValid: false});
  const [loadingPage, setLoadingPage] = useState(true);

  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [feedback, setFeedback] = useState(`Mint 5+ Bees to adopt a Beehive and earn royalties for life!`);
  // const [feedback, setFeedback] = useState(`"We aren't anti-social... We're anti-low vibing energy, anti-fakeness, and anti-bullsh*t."`);
  const [mintAmount, setMintAmount] = useState(1);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    WL_WEI_COST: 0,
    WL_DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });

  const claimNFTs = () => {
    let cost = CONFIG.WEI_COST;
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit + mintAmount * 3000);
    console.log("Cost: ", totalCostWei);
    console.log("Gas limit: ", totalGasLimit);
    setFeedback(`Preparing your ${CONFIG.NFT_NAME}...`);
    setClaimingNft(true);
    blockchain.smartContract.methods
      .mint(mintAmount)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("It seems the transaction was cancelled or something went wrong, please try again.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          <s.TextDescription
              style={{
                textAlign: "center",
                color: "var(--primary-text)",
              }}
            >
              Woohoo! Your Bee NFTs are swarming at<p/>' 
              <StyledLink target={"_blank"} href={CONFIG.MARKETPLACE_LINK}>
                {truncate(CONFIG.MARKETPLACE, 20)}
              </StyledLink>'
            </s.TextDescription>
        );
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));
      });
  };

  const claimWhitelistNFTs = () => {
    let cost = CONFIG.WL_WEI_COST;
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);
    console.log("Cost: ", totalCostWei);
    console.log("Gas limit: ", totalGasLimit);
    setFeedback(`Preparing your ${CONFIG.NFT_NAME}...`);
    setClaimingNft(true);
    blockchain.smartContract.methods
      .whitelistMint(mintAmount, userWhitelist.proof)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("It seems the transaction was cancelled or something went wrong, please try again.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          <s.TextDescription
              style={{
                textAlign: "center",
                color: "var(--primary-text)",
              }}
            >
              Woohoo! Your Bee NFTs are swarming at<p/>' 
              <StyledLink target={"_blank"} href={CONFIG.MARKETPLACE_LINK}>
                {truncate(CONFIG.MARKETPLACE, 20)}
              </StyledLink>'
            </s.TextDescription>
        );
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));
      });
  };

  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }
    setMintAmount(newMintAmount);
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    if (newMintAmount > maxmintAmount) {
      newMintAmount = maxmintAmount;
    }
    setMintAmount(newMintAmount);

    // set the newmintamount to the maxamount from the contract
  };

  const getData = async () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      setLoadingPage(true);
      dispatch(fetchData(blockchain.account));

      // Calculate merkle root from the whitelist array
      const leafNodes = whiteListAddr.map((addr) => keccak256(addr));
      const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
      const root = merkleTree.getRoot();

      //get leaf and proof
      const leaf = keccak256(blockchain.account);
      const proof = merkleTree.getHexProof(leaf);

      // Verify Merkle Proof
      const isValid = merkleTree.verify(proof, leaf, root);


      setUserWhitelist({...userWhitelist, proof: proof, isValid: isValid});

      const maxAmount = await blockchain.smartContract.methods.maxMintAmountPerTx().call();
      setMaxMintAmount(maxAmount);

      const whitelistMint = await blockchain.smartContract.methods.whitelistMintEnabled().call();
      setWhitelistMint(whitelistMint);

      const WLClaimed = await blockchain.smartContract.methods.whitelistClaimed(blockchain.account).call();
      setWhitelistClaimed(WLClaimed);

      const paused = await blockchain.smartContract.methods.paused().call();
      setCPaused(paused);
      setLoadingPage(false);
    }
  };

  const getWhiteList = async () => {
    const configResponse = await fetch("/config/whitelist.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    setWhiteListAddr(config);
    setLoadingPage(false);
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
    getWhiteList();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  return (
    <s.Screen>
      <s.Container
        flex={1}
        ai={"center"}
        style={{ padding: 0, backgroundColor: "var(--primary)" }}
        image={CONFIG.SHOW_BACKGROUND ? "/config/images/bg.png" : true}
      >
        <Gallery>
          <div className='photobanner'>
          <a href="https://thebeecollab.com/roadmap">
            <img src={i90} alt='' />
            {/* <img src={i25} alt='' />
            <img src={i24} alt='' />
            <img src={i23} alt='' />
            <img src={i22} alt='' /> */}
            <img src={i11} alt='' />
            {/* <img src={i31} alt='' />
            <img src={i30} alt='' />
            <img src={i29} alt='' />
            <img src={i28} alt='' />
            <img src={i27} alt='' /> */}
            <img src={i90} alt='' />
            {/* <img src={i14} alt='' />
            <img src={i15} alt='' />
            <img src={i16} alt='' />
            <img src={i17} alt='' />
            <img src={i18} alt='' /> */}
            <img src={i11} alt='' />
            {/* <img src={i19} alt='' />
            <img src={i20} alt='' />
            <img src={i21} alt='' />
            <img src={i26} alt='' /> */}
            <img src={i90} alt='' />
            </a>
          </div>
        </Gallery>
        <div>
<a href="https://thebeecollab.com/roadmap">
<StyledImg4 src={i97} style={{ width: 500, height: 200, padding: 0 }}/>
</a>
</div>
        {/* <StyledLogo alt={"logo"} src={"/config/images/97.png"} /> */}
        <s.SpacerSmall />
        <ResponsiveWrapper flex={1} style={{ padding: 40 }} test>
          <s.Container flex={1} jc={"center"} ai={"center"}>
            <StyledImg alt={"example"} src={"/config/images/aa.gif"} />
          </s.Container>
          <s.SpacerLarge />
          <s.Container
            flex={2}
            jc={"center"}
            ai={"center"}
            style={{
              backgroundColor: "var(--accent)",
              padding: 24,
              borderRadius: 100,
              border: "4px dashed var(--secondary)",
              boxShadow: "0px 5px 11px 2px rgba(0,0,0,0.7)",
            }}
          >
                       <s.TextTitle
              style={{
                textAlign: "center",
                fontSize: 36,
                fontWeight: "bold",
                color: "var(--accent-text)",
              }}
            >
            The Bee Collab
            </s.TextTitle>
            <s.TextTitle
              style={{
                textAlign: "center",
                fontSize: 16,
                fontWeight: "bold",
                color: "var(--accent-text)",
              }}
            >
            Autistic Adventures Farm is the name of our Farm that will house The Bee Collab Sanctuary.
            Besides Saving the Bees with NFTs and making delicious Honey to share with our Investors, 
            Autistic Adventures Farm will bee an Education Center that helps Neuro Divergent children 
            be more comfortable in their own skin. Together we will spread the importance of Bees 
            worldwide and partner with Farmlands to maximize crop production and expand our Honey operation! 
            Eventually, every NFT will represent a royalty producing IRL Beehive, and be paid out in our
            deflationary community Token governed by a DAO.<p/>
            <s.TextDescription style={{ textAlign: "center" }}>
                   {" "}
                  <a
                    target={""}
                    href={"https://discord.gg/thebeecollab"}
                  >
                   Join Discord for more Info
                  </a>
                </s.TextDescription>
                <s.TextDescription style={{ textAlign: "center" }}>
                   {" "}
                  <a
                    target={""}
                    href={"https://opensea.io/collection/autistic-adventures"}
                  >
                   View Collection on Opensea
                  </a>
                </s.TextDescription>
                <s.TextDescription style={{ textAlign: "center" }}>
                   {" "}
                  <a
                    target={""}
                    href={"https://thebeecollab.com/roadmap"}
                  >
                   Study The Bee Collab Roadmap
                  </a>
                </s.TextDescription>
            </s.TextTitle>
            {/* <s.TextTitle
              style={{
                textAlign: "center",
                fontSize: 20,
                fontWeight: "bold",
                color: "var(--accent-text)",
              }}
            >
              {data.totalSupply} / 2000 Phase 1
            </s.TextTitle> */}
            <s.SpacerSmall />
            {loadingPage ? (
              <>
                <s.TextDescription
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  loading....
                </s.TextDescription>
              </>
            ) : ( 
              <>
                {Number(data.totalSupply) >= CONFIG.MAX_SUPPLY ? (
                  <>
                    <s.TextTitle
                      style={{ textAlign: "center", color: "var(--accent-text)" }}
                    >
                      This collection has sold out.
                    </s.TextTitle>
                    <s.TextDescription
                      style={{ textAlign: "center", color: "var(--accent-text)" }}
                    >
                      You can still trade {CONFIG.NFT_NAME} at
                    </s.TextDescription>
                    <s.SpacerSmall />
                    <StyledLink target={"_blank"} href={CONFIG.MARKETPLACE_LINK}>
                      {CONFIG.MARKETPLACE}
                    </StyledLink>
                  </>
                ) : (
                  <>
                    <s.TextTitle
                      style={{ textAlign: "center", color: "var(--accent-text)" }}
                    >
                      {whitelistMint ? (
                        <>
                          1 {CONFIG.SYMBOL} costs {CONFIG.WL_DISPLAY_COST}{" "}
                          {CONFIG.NETWORK.SYMBOL} + Gas.
                        </>
                      ) : (
                        <>
                          1 {CONFIG.SYMBOL} costs {CONFIG.DISPLAY_COST}{" "}
                          {CONFIG.NETWORK.SYMBOL} + Gas.
                        </>
                      )}
                      {/* 1 {CONFIG.SYMBOL} costs {CONFIG.DISPLAY_COST}{" "}
                      {CONFIG.NETWORK.SYMBOL} + Gas. */}
                    </s.TextTitle>
                    <s.SpacerXSmall />
                    <s.TextDescription
                      style={{ textAlign: "center", color: "var(--accent-text)" }}
                    >
                      Gas is highly optimized and very cheap
                    </s.TextDescription>
                    <s.SpacerSmall />
                    {blockchain.account === "" ||
                    blockchain.smartContract === null ? (
                      <s.Container ai={"center"} jc={"center"}>
                        <s.TextDescription
                          style={{
                            textAlign: "center",
                            color: "var(--accent-text)",
                          }}
                        >
                          Connect to the {CONFIG.NETWORK.NAME} network
                        </s.TextDescription>
                        <s.SpacerSmall />
                        <StyledButton
                          onClick={(e) => {
                            e.preventDefault();
                            dispatch(connect());
                            getData();
                          }}
                        >
                          CONNECT WALLET
                        </StyledButton>
                        {blockchain.errorMsg !== "" ? (
                          <>
                            <s.SpacerSmall />
                            <s.TextDescription
                              style={{
                                textAlign: "center",
                                color: "var(--accent-text)",
                              }}
                            >
                              {blockchain.errorMsg}
                            </s.TextDescription>
                          </>
                        ) : null}
                      </s.Container>
                    ) : (
                      <>
                        <s.TextDescription
                          style={{
                            textAlign: "center",
                            color: "var(--accent-text)",
                          }}
                        >
                          {feedback}
                        </s.TextDescription>
                        <s.SpacerMedium />
                        <s.Container ai={"center"} jc={"center"} fd={"row"}>
                          <StyledRoundButton
                            style={{ lineHeight: 0.4 }}
                            disabled={claimingNft ? 1 : 0}
                            onClick={(e) => {
                              e.preventDefault();
                              decrementMintAmount();
                            }}
                          >
                            -
                          </StyledRoundButton>
                          <s.SpacerMedium />
                          <s.TextDescription
                            style={{
                              textAlign: "center",
                              color: "var(--accent-text)",
                            }}
                          >
                            {mintAmount}
                          </s.TextDescription>
                          <s.SpacerMedium />
                          <StyledRoundButton
                            disabled={claimingNft ? 1 : 0}
                            onClick={(e) => {
                              e.preventDefault();
                              incrementMintAmount();
                            }}
                          >
                            +
                          </StyledRoundButton>
                        </s.Container>
                        <s.SpacerSmall />
                        <s.Container ai={"center"} jc={"center"} fd={"row"}>
                          {whitelistMint && cPaused ? (
                            <>
                              {userWhitelist.isValid ? (
                                <>
                                  {whitelistClaimed >= maxmintAmount ? (
                                    <s.TextDescription
                                      style={{
                                          textAlign: "center",
                                          color: "var(--accent-text)",
                                        }}
                                      >
                                        This Address has Claimed all it's whitelist Mint!!!
                                      </s.TextDescription>
                                  ) : (
                                    <StyledButton
                                      disabled={claimingNft ? 1 : 0}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        claimWhitelistNFTs();
                                        getData();
                                      }}
                                    >
                                      {claimingNft ? "BUZZY..." : "WHITELIST MINT"}
                                    </StyledButton>
                                  )}
                                </>
                              ) : (
                                <s.TextDescription
                                style={{
                                    textAlign: "center",
                                    color: "var(--accent-text)",
                                  }}
                                >
                                  You're not on the whitelist!!!
                                </s.TextDescription>
                              )} 
                            </>
                          ) : cPaused ? (
                            <s.TextDescription
                                style={{
                                    textAlign: "center",
                                    color: "var(--accent-text)",
                                  }}
                                >
                                  Contract is paused!!!
                                </s.TextDescription>
                          ) : (  
                            <>
                              <StyledButton
                                disabled={claimingNft ? 1 : 0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  claimNFTs();
                                  getData();
                                }}
                              >
                                {claimingNft ? "BUZZY..." : "PUBLIC MINT"}
                                {/* {claimingNft ? "YOU WILL WASTE GAS" : "STOP - WE ARE NOT LIVE"} */}

                              </StyledButton>
                            </>
                          )}
                          
                        </s.Container>
                      </>
                    )}
                  </>
                )}
              </>
            )}
            
            <s.SpacerMedium />
          </s.Container>
          <s.SpacerLarge />
          <s.Container flex={1} jc={"center"} ai={"center"}>
            <StyledImg
              alt={"example"}
              src={"/config/images/example.gif"}
              style={{ transform: "scaleX(1)" }}
            />
          </s.Container>
        </ResponsiveWrapper>
        <s.SpacerMedium />
        <s.Container jc={"center"} ai={"center"} style={{ width: "70%" }}>
        <s.TextDescription
              style={{
                textAlign: "center",
                color: "var(--primary-text)",
              }}
            >
              Contract Address: <StyledLink target={"_blank"} href={CONFIG.SCAN_LINK}>
                {truncate(CONFIG.CONTRACT_ADDRESS, 42)}
              </StyledLink>
            </s.TextDescription>
            <s.SpacerMedium />
          {/* <s.TextDescription
            style={{
              textAlign: "center",
              color: "var(--primary-text)",
            }}
          >
            Please do not change the gas, we utilized ERC721A contract so you can mint up to 23 NFTs for the price of 2.  
          </s.TextDescription> */}
          {/* <s.TextDescription
            style={{
              textAlign: "center",
              color: "var(--primary-text)",
            }}
          >
            Mobile users must open TheBeeCollab.io from MetaMask Browser to mint an NFT
          </s.TextDescription> */}
        </s.Container>
      </s.Container>
    </s.Screen>
  );
}

export default App;
