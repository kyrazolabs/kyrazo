import{Y as y,ha as h,la as v}from"./chunk-AILEILVM.js";import{v as g}from"./chunk-NKSM5XHW.js";import{$a as l,Jb as p,Kb as f,O as c,P as s,T as r,Vb as u,_a as d,cb as a,cc as m,ka as o}from"./chunk-73PELQKU.js";var I=`
    .p-iconfield {
        position: relative;
        display: block;
    }

    .p-inputicon {
        position: absolute;
        top: 50%;
        margin-top: calc(-1 * (dt('icon.size') / 2));
        color: dt('iconfield.icon.color');
        line-height: 1;
        z-index: 1;
    }

    .p-iconfield .p-inputicon:first-child {
        inset-inline-start: dt('form.field.padding.x');
    }

    .p-iconfield .p-inputicon:last-child {
        inset-inline-end: dt('form.field.padding.x');
    }

    .p-iconfield .p-inputtext:not(:first-child),
    .p-iconfield .p-inputwrapper:not(:first-child) .p-inputtext {
        padding-inline-start: calc((dt('form.field.padding.x') * 2) + dt('icon.size'));
    }

    .p-iconfield .p-inputtext:not(:last-child) {
        padding-inline-end: calc((dt('form.field.padding.x') * 2) + dt('icon.size'));
    }

    .p-iconfield:has(.p-inputfield-sm) .p-inputicon {
        font-size: dt('form.field.sm.font.size');
        width: dt('form.field.sm.font.size');
        height: dt('form.field.sm.font.size');
        margin-top: calc(-1 * (dt('form.field.sm.font.size') / 2));
    }

    .p-iconfield:has(.p-inputfield-lg) .p-inputicon {
        font-size: dt('form.field.lg.font.size');
        width: dt('form.field.lg.font.size');
        height: dt('form.field.lg.font.size');
        margin-top: calc(-1 * (dt('form.field.lg.font.size') / 2));
    }
`;var D=["*"],x={root:({instance:e})=>["p-iconfield",{"p-iconfield-left":e.iconPosition=="left","p-iconfield-right":e.iconPosition=="right"}]},F=(()=>{class e extends y{name="iconfield";theme=I;classes=x;static \u0275fac=(()=>{let n;return function(t){return(n||(n=o(e)))(t||e)}})();static \u0275prov=c({token:e,factory:e.\u0275fac})}return e})();var j=(()=>{class e extends v{iconPosition="left";styleClass;_componentStyle=r(F);static \u0275fac=(()=>{let n;return function(t){return(n||(n=o(e)))(t||e)}})();static \u0275cmp=d({type:e,selectors:[["p-iconfield"],["p-iconField"],["p-icon-field"]],hostVars:2,hostBindings:function(i,t){i&2&&u(t.cn(t.cx("root"),t.styleClass))},inputs:{iconPosition:"iconPosition",styleClass:"styleClass"},features:[m([F]),a],ngContentSelectors:D,decls:1,vars:0,template:function(i,t){i&1&&(p(),f(0))},dependencies:[g],encapsulation:2,changeDetection:0})}return e})(),J=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=l({type:e});static \u0275inj=s({imports:[j]})}return e})();var z=["*"],B={root:"p-inputicon"},M=(()=>{class e extends y{name="inputicon";classes=B;static \u0275fac=(()=>{let n;return function(t){return(n||(n=o(e)))(t||e)}})();static \u0275prov=c({token:e,factory:e.\u0275fac})}return e})(),S=(()=>{class e extends v{styleClass;_componentStyle=r(M);static \u0275fac=(()=>{let n;return function(t){return(n||(n=o(e)))(t||e)}})();static \u0275cmp=d({type:e,selectors:[["p-inputicon"],["p-inputIcon"]],hostVars:2,hostBindings:function(i,t){i&2&&u(t.cn(t.cx("root"),t.styleClass))},inputs:{styleClass:"styleClass"},features:[m([M]),a],ngContentSelectors:z,decls:1,vars:0,template:function(i,t){i&1&&(p(),f(0))},dependencies:[g,h],encapsulation:2,changeDetection:0})}return e})(),ee=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=l({type:e});static \u0275inj=s({imports:[S,h,h]})}return e})();export{j as a,J as b,S as c,ee as d};
