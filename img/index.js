/** 奖项配置 */
var STORAGE_TOTAL_NUMS = "totalNums";	// 奖池数组
var STORAGE_LUCK_NUMS = "luckNums";	//
var STORAGE_LUCK_NUM_GROUPS = "luckNumGroups";// 组
var STORAGE_GROUP_LUCKS = "groupLucks";	// 中奖号码 组内中奖的号码

var DrawConfig = {
	g_Interval:20
	,g_Person:[]		// 参与抽奖的号码
	,g_Timers:[]		// 定时器对象数组
	,g_PersonLuck:[]	// 已经中奖号码
	,running:false		// 是否正在执行
	,numMaxLen:0		// 抽奖池是最大长度【用于数字补0，如最大是numMaxLen=4位数   88 --》 0088】
	,actId:null
	,groupId:null
	,luchCount:null
	,leverId:null
};

/**
 * 抽奖首页
 */
var Manager = {
	actId :null,
	// 初始化
	init : function(){
		this.bindEvent();
	    var pondList = Manager.getPondList();
	    
	    //如果抽奖池或未中奖的数值小于等于0时提示用户初始化抽奖池
		if(pondList.length<=0){
			Manager.initPondData();
		}
		
	    //加载
	    Manager.loadGroupList();
	    Common.fitBox();
	},
	
	//初始化奖池
	initPondData:function(layero){
		layer.open({
    		title: '初始化奖池',
    		type: 1,
		  	area: ['420px', '250px'], //宽高
		  	content: $(".jsAddPondBox").html(),
		  	btn: ['确定', '取消'],
		  	yes: function(index, layero){
		  		var minNumObj = $(layero).find(".jsMinNum");
		  		var maxNumObj = $(layero).find(".jsMaxNum");
		  		
		  		
		  		if(minNumObj.val() == '' || $.trim(minNumObj.val()) == ''){
		  	    	layer.tips('请输入最小号码！', minNumObj, {tips: [1, '#78BA32'],time: 3000});minNumObj.focus();return false;
		  	    }else{
		  	    	//^[0-9]*[1-9][0-9]*$
		  	    	if(!/^[0-9]*[1-9][0-9]*$/.test($.trim(minNumObj.val()))){
			    		layer.tips('请输入正整数！', minNumObj, {tips: [1, '#78BA32'],time: 3000});minNumObj.select();return false;
			    	}
		  	    }
		  	    if(maxNumObj.val() == '' || $.trim(maxNumObj.val()) == ''){
			    	layer.tips('请输入最大号码！', maxNumObj, {tips: [1, '#78BA32'],time: 3000});maxNumObj.focus();return false;
			    }else{
			    	if(!/^[0-9]*[1-9][0-9]*$/.test($.trim(maxNumObj.val()))){
			    		layer.tips('请输入正整数！', maxNumObj, {tips: [1, '#78BA32'],time: 3000});maxNumObj.select();return false;
			    	}
			    }
		  	    
		  	    var minNum = parseInt(minNumObj.val());
				var maxNum = parseInt(maxNumObj.val());
				
		  	  	if(minNum>maxNum){
		  	    	layer.tips('最小值不能大于最大值！', minNumObj, {tips: [1, '#78BA32'],time: 3000});minNumObj.focus();return false;
		  	    }
		  		
				var luckNumsArr = [];
				for(var i = minNum; i <= maxNum; i++){
					luckNumsArr.push({id:i, num:i});
				}
				//清空奖池
				localStorage.setItem(STORAGE_TOTAL_NUMS, JSON.stringify(luckNumsArr));
				localStorage.setItem(STORAGE_GROUP_LUCKS, null);
				localStorage.setItem(STORAGE_LUCK_NUMS, null);
				
				Manager.loadGroupList();
				layer.alert('初始化数据成功！<br/>抽奖池内共有【'+minNum+'~'+maxNum+'】'+(maxNum-minNum+1)+'个抽奖号码');
		  	    layer.close(index); //如果设定了yes回调，需进行手工关闭
		  	    //
		  	},cancel: function(){ 
		  	    //右上角关闭回调
		    }
		});
	},
	
	//获取抽奖池数据
	getPondList : function(){
    	var localS = localStorage.getItem(STORAGE_TOTAL_NUMS);
    	if(localS == null|| localS == '' || localS == 'null'){
  	    	localS = '[]';
  	    }
    	var ponObjs = eval('('+localS+')');
    	
    	return ponObjs;
    },
    
    //获取可用的奖池号码
    getAvailableNms:function(){
    	var pondList = Manager.getPondList();
    	var availableNms = [];
    	var luckNms = DrawCtrl.getLuckNums();
    	for(var i = 0; i< pondList.length; i++){
    		var availableNm = pondList[i];
    		ok:
    		for(var j = 0; j<luckNms.length; j++){
    			if(null != luckNms[j] && availableNm.num == luckNms[j]){
    				availableNm = null;
    				break ok;
    			}
    		}
    		if(null != availableNm){
    			availableNms.push(availableNm);
    		}
    	}
    	return availableNms;
    },
	
	//获取组数据
	getGroupList : function(){
    	var localS = localStorage.getItem(STORAGE_LUCK_NUM_GROUPS);
    	if(localS == null|| localS == '' || localS == 'null'){
  	    	localS = '[]';
  	    }
    	var groupListObjs = eval('('+localS+')');
    	
    	return groupListObjs;
    },
    
    //加载页面
	loadGroupList : function(){
    	var groupListObj = Manager.getGroupList();
		$(".jsGroupList tbody").empty();
    	if(groupListObj.length > 0){
    		for(var i = 0; i < groupListObj.length; i++){
    			var luckNums = DrawCtrl.getLuckByGroup(groupListObj[i].id);
    			var luckNumsSize = 0;
    			if(luckNums != null&&luckNums.nms!=null&&luckNums.nms!=''){
    				luckNumsSize = luckNums.nms.split(",").length;
    			}
    			var btns = '<a href="javascript:void(0);" groupId="'+groupListObj[i].id+'" class="jsDelGroup layui-btn layui-btn-small layui-btn-danger">删除</a>';
    			btns += '&nbsp;&nbsp;&nbsp;&nbsp;<a href="draw-ctrl.html?groupId='+groupListObj[i].id+'&luckNum='+groupListObj[i].gnm+'" groupId="'+groupListObj[i].id+'" class="jsEnterDraw layui-btn layui-btn-small">进入抽奖</a>';
    			btns += '&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:void(0);" groupId="'+groupListObj[i].id+'" class="jsShowResult layui-btn layui-btn-small">结果</a>';
    			var tr = '<tr><td>'+groupListObj[i].gn+'</td><td>'+groupListObj[i].gnm+'</td><td>'+luckNumsSize+'</td><td>'+btns+'</td></tr>';
    			$(".jsGroupList tbody").append(tr);
    		}
    	}
    	$(".jsGroupList tbody tr:odd").addClass('odd');
    },
    //绑定数据
	
    bindEvent:function(){
		//删除分组
	    $('.jsDelGroup').live('click', function(){
	    	var _this = $(this);
	    	layer.confirm("删除后会清除本组的中奖号码！确定要执行吗？", function(idx){
	    		var currId = _this.attr('groupId');
		    	var groupList = Manager.getGroupList();
		    	for(var i = 0; i< groupList.length; i++){
		    		if(groupList[i].id == currId){
		    			groupList.splice(i, 1);
		    			break;
		    		}
		    	}
		    	//删除本组中奖的数据
		    	var groupLucks = DrawCtrl.getLucks();
		    	for(var i = 0; i< groupLucks.length;i++){
		    		if(groupLucks[i].gid == currId){
		    			groupLucks.splice(i, 1);
		    			break;
		    		}
		    	}
		    	localStorage.setItem(STORAGE_GROUP_LUCKS, JSON.stringify(groupLucks));
		    	localStorage.setItem(STORAGE_LUCK_NUM_GROUPS, JSON.stringify(groupList));
		    	Manager.loadGroupList();
		    	layer.close(idx);
	    	});
	    });
	    
	    //初始化抽奖池数据点击事件
	    $(".jsInitPond").click(function(){
	    	layer.confirm("初始化后将清空所有奖池数据！确定要执行吗？", function(idx){
	    		layer.close(idx);
	    		Manager.initPondData();
	    	});
		});
	    
	    //查看奖池
	    $(".jsViewPond").click(function(){
	    	layer.open({
	    		title: '查看奖池',
	    		type: 1,
			  	area: ['700px', '500px'], //宽高
			  	content: $(".jsViewPondBox").html(),
			  	btn: ['取消'],
			  	success:function(layero, index){
			  		Manager.loadResultList('all');
			  	},cancel: function(){ 
			  	    //右上角关闭回调
			    }
			});
		});
	    
	    //添加分组
	    $(".jsAddGroup").click(function(){
	    	layer.open({
	    		title: '添加分组',
	    		type: 1,
    		  	area: ['420px', '250px'], //宽高
    		  	content: $(".jsAddGroupBox").html(),
    		  	btn: ['确定', '取消'],
    		  	yes: function(index, layero){
    		  	    //do something
    		  	    var result = Manager.saveGroupData(layero);
    		  	    if(result){
    		  	    	layer.close(index); //如果设定了yes回调，需进行手工关闭
    		  	    }
    		  	    //
    		  	},cancel: function(){ 
    		  	    //右上角关闭回调
    		    }
    		});
	    });
	    
	    //显示所有奖池
	    $('.jsAllPond').live('click', function(){
	    	$(this).removeClass('layui-btn-primary').siblings("a").addClass('layui-btn-primary');
	    	Manager.loadResultList('all');
	    });
	    //显示已中奖的号码
	    $('.jsViewLuckNum').live('click', function(){
	    	$(this).removeClass('layui-btn-primary').siblings("a").addClass('layui-btn-primary');
	    	Manager.loadResultList('lucks');
	    });
	    //显示未中奖的号码
	    $('.jsViewNoLuckNum').live('click', function(){
	    	$(this).removeClass('layui-btn-primary').siblings("a").addClass('layui-btn-primary');
	    	Manager.loadResultList('nolucks');
	    });
	    
	    //显示中奖的号码
	    $('.jsShowResult').live('click', function(){
	    	var _this = $(this);
	    	var groupId = _this.attr("groupId");
	    	var currTr =_this.parent().parent();
	    	
	    	layer.open({
	    		title: currTr.find("td:eq(0)").text() + '中奖结果【共'+currTr.find("td:eq(2)").text()+'个】',
	    		type: 1,
    		  	area: ['500px', '300px'], //宽高
    		  	content: $(".jsLuckResultBox").html(),
    		  	btn: ['确定', '取消'],
    		  	success:function(layero, index){
    		  		var luckNums = DrawCtrl.getLuckByGroup(groupId);
        			var luckNumsArr = [];
        			if(luckNums != null){
        				luckNumsArr = luckNums.nms.split(",");
        			}
        			var ul = $(layero).find(".jsShowLuckNms");
        			for(var i = 0; i< luckNumsArr.length;i++){
        				var li = '<li>'+luckNumsArr[i]+'</li>';
        				ul.append(li);
        			}
    		  	},
    		  	yes: function(index, layero){
    		  	    layer.close(index); //如果设定了yes回调，需进行手工关闭
    		  	},cancel: function(){ 
    		    }
    		});
	    });
	},
	
	//加载中奖列表数据
	loadResultList : function(query){
    	//获取奖池的所有数据
  		var ponds = [];
    	$(".jsPondList tbody").empty();
    	switch(query){
    		case "all"://获取所有号码
    			ponds = Manager.getPondList();
    			break;
    		case "lucks"://过滤未中奖的，只获取中奖的
    			ponds = Manager.getPondList();
    			var luckNums = DrawCtrl.getLuckNums();
    			var lucks = [];
    			for(var i = 0; i < ponds.length; i++){
    				ok:
    				for(var j = 0; j< luckNums.length; j++){
    					if(ponds[i].num == luckNums[j]){
    						lucks.push(ponds[i]);
    						break ok;
    					}
    				}
    			}
    			ponds = lucks;
    			break;
    		case 'nolucks'://过滤已中奖的
    			ponds = Manager.getPondList();
    			var luckNums = DrawCtrl.getLuckNums();
    			var nolucks = [];
    			for(var i = 0; i < ponds.length; i++){
    				var luckN = null;
    				ok:
    				for(var j = 0; j< luckNums.length; j++){
    					if(ponds[i].num == luckNums[j]){
    						luckN = ponds[i];
    						break ok;
    					}
    				}
    				if(luckN == null){
    					nolucks.push(ponds[i]);
    				}
    			}
    			ponds = nolucks;
    			break;
    	}
  		for(var i = 0; i < ponds.length; i++){
  			var id = ponds[i].id;
  			var num = ponds[i].num;
  			var isLuck = Manager.isLuckNum(num);
  			var group = Manager.getGroupNameByNum(num);
  			var status = isLuck?"<i style='color:green'>已中奖</i>":"-";
  			var tr = '<tr><td>'+num+'</td><td>'+group+'</td><td>'+status+'</td></tr>';
  			$(".jsPondList tbody").append(tr);
  		}
  		
  		$(".jsPondList tbody tr:odd").addClass('odd');
    },
	
	//通过中奖的号码得到所在的组
    getGroupNameByNum:function(num){
    	var groupList = this.getGroupList();
    	var luckNums = DrawCtrl.getLucks();
    	var gId = '';
    	var gName = '';
    	ok:
    	for(var i = 0; i<luckNums.length; i++){
    		var groupNumsArr = luckNums[i].nms.split(',');
    		for(var j = 0; j<groupNumsArr.length;j++){
    			if(num == groupNumsArr[j]){
    				gId = luckNums[i].gid;
    				break ok;
    			}
    		}
    	}
    	for(var i=0; i<groupList.length; i++){
    		if(gId == groupList[i].id){
    			gName = groupList[i].gn;
    			break;
    		}
    	}
    	return gName;
    },
	
	//是否中奖
	isLuckNum:function(num){
		var luckNmsArr = DrawCtrl.getLuckNums();
		for(var i=0; i< luckNmsArr.length; i++){
			if(num == luckNmsArr[i]){
				return true;
			}
		}
		return false;
	},
	
	//保存数据到缓存
	saveGroupData:function(layero){
		var groupNameObj = $(layero).find(".jsGroupName");
		var groupNumObj = $(layero).find(".jsGroupNum");
		var groupName = groupNameObj.val();
  	    var groupNum = groupNumObj.val();
  	    
  	    if(groupName == '' || $.trim(groupName) == ''){
  	    	layer.tips('请输入组名称！', groupNameObj, {tips: [1, '#78BA32'],time: 3000});groupNameObj.focus();return false;
  	    }
  	    if(groupNum == '' || $.trim(groupNum) == ''){
	    	layer.tips('请输入号码数！', groupNumObj, {tips: [1, '#78BA32'],time: 3000});groupNumObj.focus();return false;
	    }else{
	    	if(!/^[0-9]*[1-9][0-9]*$/.test($.trim(groupNum))){
	    		layer.tips('请输入正整数！', groupNumObj, {tips: [1, '#78BA32'],time: 3000});groupNumObj.select();return false;
	    	}
	    }
  	    
  	    //获取所有的值
  	    var groups = Manager.getGroupList();
  	    
  	    var id = new Date().getTime();
  	  	var groupObj = {id:id, gn:groupName, gnm:groupNum};
  	  	groups.push(groupObj);
  	  	localStorage.setItem(STORAGE_LUCK_NUM_GROUPS, JSON.stringify(groups));
  	  	Manager.loadGroupList();
  	  	return true;
	}
};

/**
 * 抽奖控制器
 */
var DrawCtrl = {
	// 用于临时存储幸运号码
	tempLuckNums:[],
	init:function(){
		var groupId = Common.getQueryString("groupId");
		var luckNum = Common.getQueryString("luckNum");
		//初始化所有数字池
		DrawConfig.groupId = groupId;
		DrawConfig.luchCount = luckNum;
		
		// 获取等级数据
		var width = 0;
		if(luckNum > 5){
			width = $(".jsDrawLever").width()/5;
		}else{
			width = $(".jsDrawLever").width()/luckNum;
		}
		//初始化组
		for(var i = 0; i< parseInt(luckNum); i++){
			var liHtml = '<li class="resultNum" style="width:'+width+'px"></li>';
			if(luckNum == 1){
				liHtml = '<li class="max-luck-box resultNum" style="width:'+width+'px"></li>';
			}
			$(".jsDrawLever").append(liHtml);
		}
		
		DrawCtrl.bindEvent();
		
		//初始化当前组中中奖号码
		var luckNums = DrawCtrl.getLucks();
		if(luckNums.length==0){
			var lns = [{gid:groupId, nms:''}];
			localStorage.setItem(STORAGE_GROUP_LUCKS, JSON.stringify(lns));
		}else{
			var currGroup = null;
			for(var i = 0; i<luckNums.length; i++){
				if(luckNums[i].gid == groupId){
					currGroup = luckNums[i];
					break;
				}
			}
			if(currGroup == null){
				luckNums.push({gid:groupId, nms:''});
				localStorage.setItem(STORAGE_GROUP_LUCKS, JSON.stringify(luckNums));
			}else{
				DrawCtrl.tempLuckNums = currGroup.nms.split(',');
			}
		}
		
		Common.fitBox();
	},
	
	//绑定事件
	bindEvent:function(){
		$(".jsCtrlBtn").click(function(){
			DrawCtrl.beginRndNum(this);
		})
	},
	
	//开始，结束控制事件
	beginRndNum : function(trigger){
		if(DrawConfig.running){
			//停止操作
			DrawConfig.running = false;
			DrawCtrl.clearIntervals(DrawConfig.g_Timers);
			
			$(trigger).val("开始");
			$('.resultNum').css('color','red');
		} else{
			var totalNmsArr = Manager.getPondList();
			var luckNumArr = this.getLuckNums();
			var drawSize = $('.jsDrawLever li').size();
			//判断奖池数据
			if(totalNmsArr!= null && totalNmsArr.length<=0){
				layer.alert('奖池里没有数据，请重新初始化奖池！', function(idx){
					location.href="index.html";
				});
				return;
			}else if(totalNmsArr.length - luckNumArr.length <= drawSize){//如果剩余的奖池数据少于本组中奖数则提示
				layer.alert('奖池剩余数量不足，请重新初始化奖池！', function(idx){
					location.href="index.html";
				});
				return;
			}
			
			//DrawConfig.g_PersonLuck = [];
			DrawConfig.running = true;
			$('.resultNum').css('color','black');
			$(trigger).val("停止");
			$('.jsDrawLever li').each(function(i, o){
				DrawCtrl.beginTimer($(o));
			});
		}
	},
	
	//原理 用一个数组来保存所有定时器的id 
    clearIntervals:function(array){
    	var i = 0;
    	//清除定时器
    	var clear = function(){
    		// 获取幸运数字
        	var luckNum = $(".resultNum:eq("+i+")").text();
        	// 判断数组里面是否存在该幸运数字
        	if(!DrawCtrl.checkSameNum(luckNum)){
        		// 添加幸运数字到数组里面
            	DrawConfig.g_PersonLuck.push(luckNum);
            	DrawCtrl.tempLuckNums.push(luckNum);
            	// 停止定时器 
            	clearInterval(array[i]);
            	i++;
            	if(i == array.length){
            		DrawCtrl.saveLuckNum();
            	}
        	}
        	
        	if(i < array.length){
        		setTimeout(clear, 10);
        	}
    	};
    	clear();
        DrawConfig.g_Timers = [];
    },
    
    //将中奖号码加入对应的组中
    saveLuckToGroup:function(obj){
    	var groupLucks = DrawCtrl.getLucks();
    	// [{gid:gid1, nms:'1,2,23,12,312,3,12,3'},{gid:gid2, nms:'1,2,23,12,312,3,12,3'},{gid:gid3, nms:'1,2,23,12,312,3,12,3'}]
    	if(groupLucks.length > 0){
    		ok:
    		for(var i = 0; i< groupLucks.length; i++){
    			if(groupLucks[i].gid == DrawConfig.groupId){
					groupLucks[i] = obj;
					break ok;
    			}
    		}
    	}
    	
    	localStorage.setItem(STORAGE_GROUP_LUCKS, JSON.stringify(groupLucks));
    },
    
    //获取组中的中奖号码返回分组数据 [{gid:gid, nms:'21312,412,11,31,23,12,3'}]
    getLucks:function(){
    	var localS = localStorage.getItem(STORAGE_GROUP_LUCKS);
    	if(localS == null|| localS == '' || localS == 'null'){
  	    	localS = '[]';
  	    }
    	var groupLucks = eval('('+localS+')');
    	
    	return groupLucks;
    },
    
    // 获取中奖的号码数组 返回：[234,23,423,42,34,2,233]
    getLuckNums:function(){
    	var luckNums = [];
    	var luckObjs = DrawCtrl.getLucks();
    	for(var i = 0; i< luckObjs.length; i++){
    		//console.log(luckObjs[i]);
    		if(null != luckObjs[i] && luckObjs[i].nms != ''){
    			var arr = luckObjs[i].nms.split(',');
    			for(var j = 0; j<arr.length; j++){
    				if(arr[j]!=null && arr[j]!=''){
    					luckNums.push(arr[j]);
    				}
    			}
    		}
    	}
    	
    	return luckNums;
    },
    
    //通过组ID获取组中中奖数据
    getLuckByGroup:function(gid){
    	var arr = this.getLucks();
    	
    	for(var i = 0; i< arr.length;i++){
    		if(arr[i].gid == gid){
    			return arr[i];
    		}
    	}
    },
    
    //将中奖号码写入数据库中
    saveLuckNum:function(){
    	var luckNums = DrawCtrl.tempLuckNums;
    	var _data = {gid:DrawConfig.groupId, nms:luckNums.join(',')};
    	//将中奖数据存储
    	//console.log(_data);
    	DrawCtrl.saveLuckToGroup(_data);
    },
    
    //判断是否存在重复 true:重复；false:未重复
    checkSameNum:function(num){
    	for(var i = 0; i< DrawCtrl.tempLuckNums.length ;i++){
    		if(num == DrawCtrl.tempLuckNums[i]){
    			//console.log('幸运数字重复。。。' + num);
    			return true;
    		}
    	}
    	return false;
    },
    
    //执行定时器
	beginTimer : function(obj){
		DrawConfig.g_Timers.push(setInterval(function(){DrawCtrl.beat(obj);}, DrawConfig.g_Interval));
	},
	
	//更新产生的随机数
	updateRndNum : function(obj){
		var num = this.getNo();
		var availableNms = Manager.getAvailableNms();
		var txt = availableNms[num].num;
		obj.html(txt);
	},
	
	// 获取随机数
	getNo : function(){
		var availableNms = Manager.getAvailableNms();
		var num = Math.floor(Math.random() * availableNms.length);
		return num;
	},
	
	beat : function(obj) {
		DrawCtrl.updateRndNum(obj);
	}
	
	//给数字字符串补零，不支持负数
	,padNumber: function(num, fill) {
	    var len = ('' + num).length;
	    return (Array(
	        fill > len ? fill - len + 1 || 0 : 0
	    ).join(0) + num);
	}
};




/**
 * 公共方法
 */
var Common = {
	// 获取URL请求参数值
    getQueryString:function(name) {
    	var url = location.search;
		var theRequest = new Object();
		if (url.indexOf("?") != -1) {
			var str = url.substr(1);
			strs = str.split("&");
			for(var i = 0; i < strs.length; i ++) {
				theRequest[strs[i].split("=")[0]]=strs[i].split("=")[1];
			}
		}
		var str=theRequest[name];
		if(typeof str !='undefined'){
			str=str.replace(/\+/g,' ');
		}
		return str;
	},
	
	//图片自适应
	fitBox:function(){
		var starth=$('.draw-title').height();
		var startLogoH = $('.logo').height();
		var autosize=function(){
			var h=$(window).height();
			if(h<starth*2){
				$('.draw-title').height(h/2);
				$(".logo").height(h*0.03)
			}else{
				$('.draw-title').height(starth);
				$(".logo").height(startLogoH)
			}

			Common.smallHeight();
		};
		autosize();
		$(window).resize(function(){
			autosize();

		});
	},

	//缩小图片的高度
	smallHeight:function(){
		var contentH = $('.draw-title').height() + $(".wrap").height() + $(".logo").height();

		if(contentH>$(window).height()){
			var h = $('.draw-title').height() - (contentH-$(window).height());
			$('.draw-title').height(h);
		}
	}

};
