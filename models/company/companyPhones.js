import mongoose from 'mongoose';
const { Schema,model } = mongoose;

const CompanyPhone = new Schema({
  number:{type: String},
  whatsApp:{type:Boolean},
  telegram:{type:Boolean},
  companyId:{ type: Schema.Types.ObjectId, ref: 'Company' }
})

export default model('company_phone',CompanyPhone)