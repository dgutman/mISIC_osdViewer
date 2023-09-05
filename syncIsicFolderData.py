import girder_client
import os

gc = girder_client.GirderClient(apiUrl="https://wsi-deid.pathology.emory.edu/api/v1")
apiKeyName = "WSIDeID_APIKEY"
DSAKEY = os.getenv(apiKeyName)
gc.authenticate(apiKey=DSAKEY)


base_path = "/Users/dagutman/devel/mISIC/data/1.2.840.114434.000.10961822336373670458931928005632388805629"
directories = [
    d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d))
]

mISIC_baseFolderPath = "/mISIC/SampleData/SampleDataSetOne"
mISIC_folderId = gc.resourceLookup(f"/collection{mISIC_baseFolderPath}")
### Convert the resouce path into an actual UID so I can use it in subsequent query


def getFolderByDSAPath(
    folderName, baseFolderPath=mISIC_baseFolderPath, createFolder=True
):
    ### Will get a folderID given a resouce path, will add an option to not create it
    ## if the folder does not exist
    try:
        folderInfo = gc.resourceLookup(f"/collection{baseFolderPath}/{folderName}")
        return folderInfo
    except:
        ## Create the folder --- this currently assumes the rootFolder already exists.
        rootFolderInfo = gc.resourceLookup(f"/collection{baseFolderPath}")
        folderInfo = gc.createFolder(
            rootFolderInfo["_id"], folderName, reuseExisting=True
        )

        return folderInfo


## Check to see if the resource paths exists for the imageTypes
imageTypes = ["Confocal Images", "VivaStack", "VivaBlock", "Macroscopic Images"]
for imgType in imageTypes:
    imgFolder = getFolderByDSAPath(imgType)

for d in directories:
    ## The folderType is everything before the # as I want to group things
    # print(d, baseDirName)
    imgFolderType = d.split("#")[0]

    imgTypeFolder = getFolderByDSAPath(imgFolderType)

    ## Now create a subfolder for the actual image bundle, grouped by the imgFolderType
    imgFolder = gc.createFolder(imgTypeFolder["_id"], d, reuseExisting=True)

    ## Get a list of items already uploaded to the DSA to prevent reuploading files..
    itemsInFolder = list(gc.listItem(imgFolder["_id"]))

    ## Turn the itemList into names so I can use it as a filter below.
    uploadedFileNames = [x["name"] for x in itemsInFolder]

    localImgFolderPath = os.path.join(base_path, d)
    localFileList = os.listdir(localImgFolderPath)
    for lf in localFileList:
        if lf not in uploadedFileNames:
            uploadedImageFile = gc.uploadFileToFolder(
                imgFolder["_id"], filepath=os.path.join(localImgFolderPath, lf)
            )
            print(uploadedImageFile["name"])


### Check and make sure every image has a largeImage tag..
imageList = gc.get(f'resource/{mISIC_folderId["_id"]}/items?type=folder&limit=0')

for i in imageList:
    if "largeImage" not in i["meta"]:
        print(i["name"], "needs LargeImage")
        try:
            gc.post(f'item/{i["_id"]}/tiles')
        except:
            pass
