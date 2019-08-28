/**
 * Created by ronanwilliams on 2019-08-27.
 */

({

    afterRender : function($C,$H) {
        var listInputCmp    = $C.find("codelistInput");
        var listInput       = listInputCmp.getElement();
        listInput.setAttribute("list", $C.get('v.recordId'));
    }

});