var mongoose=require("mongoose");

var pantrySchema = new mongoose.Schema({
   name:String,
   email:String,
   department:String,
   room:String,
   date:String,
   pantry: String,
   stime:String,
   etime:String,
   ndate:Number,
   nstime:Number,
   netime:Number,
   ispantry:Boolean,
   pantry_id:mongoose.Schema.Types.ObjectId,
});


module.exports=mongoose.model("pantry",pantrySchema);
