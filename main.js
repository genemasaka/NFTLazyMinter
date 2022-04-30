//connect to moralis server

const serverUrl ="https://zbpqcsm9ees8.usemoralis.com:2053/server";
const appId ="4PuBq62rPRUM1IA3eUFsYv6ioaKrNQMexnSbKspo";
Moralis.start({serverUrl,appId});

// login user with automatic metamask popup when page loads
let user;
async function login() {
    console.log("test")
    user = Moralis.User.current();
    if(!user) {
        try{
            user = await Moralis.authenticate({ signinMessage: "Sign in with Metamask" });
            initApp();
        } catch(error) {
            console.log(error)
        }
    }
    else{
        Moralis.enableWeb3();
        initApp();
    }
}

function initApp() {
    document.querySelector("#app").style.display = "block";
    document.querySelector("#submit_button").onclick = submit;
}

async function submit() {
    //obtain image data
    const input = document.querySelector("#input_image");
    let data = input.files[0];

    //upload image to ipfs
    const imageFile = new Moralis.File(data.name, data);
    await imageFile.saveIPFS();
    let imageHash = imageFile.hash();
    
    //create metadata from image hash and data(name & description)
    let metadata= {
        name: document.querySelector("#input_name").value,
        description: document.querySelector("#input_description").value,
        image: "/ipfs/" + imageHash 
    }

    //upload metadata to ipfs
    const jsonFile = new Moralis.File("metadata.json", {base64: btoa(JSON.stringify(metadata))});
    await jsonFile.saveIPFS();
    let metadataHash = jsonFile.hash();
    console.log(metadataHash);

    // upload to rarible using moralis rarible plugin
  let res =  await Moralis.Plugins.rarible.lazyMint({
        chain: "ropsten",
        userAddress: user.get("ethAddress"),
        tokenType: "ERC721",
        tokenUrl: "/ipfs/" + metadataHash,
        royaltiesAmount: 5
    });

    console.log(res);
    let token_address = res.data.result.tokenAddress;
    let token_id = res.data.result.tokenId;
    let url = `https://rinkeby.rarible.com.token/${token_address}:${token_id}`;
    document.querySelector("#success_message").innerHTMl = `NFT minted. <a target="blank" href="${url}">View NFT</a>`
}

login();


