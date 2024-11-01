import EventImpressionImageService from "../../../services/EventImpressionImageService.js"

class EventImpressionImageController{
    constructor(){
        this.EventImpressionImageService = new EventImpressionImageService()
    }

    index = async (req,res) => {
        
        // let datas = await this.EventImpressionImageService.getByCollectionId({'favorites':req.user.id})
        return res.json({'status':'success','data':'data'})
    }

    store = async (req,res) => {
        let data = {};
        data.event = req.body.event_id;
        data.user = req.user.id;
        data.userName = req.user.name ? req.user.name : '';
        data.userSurname = req.user.surname ? req.user.surname : '';
        data.path = req.body.files;
        // data.images = req.files.images;
        const imp = await this.EventImpressionImageService.store(data)
        return res.json({'status':'success','data':imp})
    }

}

export default new EventImpressionImageController();