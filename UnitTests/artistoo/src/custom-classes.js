let CPM = require("./artistoo-cjs.js")

/* custom classes*/


// make contact-inhibited chemotaxis and add the saturation parameter
class ChemotaxisConstraintCI extends CPM.ChemotaxisConstraint {

	//concDiff( tp, ts ) {
	concDiff( targeti, sourcei ) {

		let ct = this.field.pixti( targeti )
		let cs = this.field.pixti( sourcei )
		let saturation_coefficient = this.parameters["s"]

		//return 0

		let out = ( ( ct / (1.0+saturation_coefficient*ct )) - (cs / (1.0+saturation_coefficient*cs ) ) )
		return out
	}

	deltaH( sourcei, targeti, src_type, tgt_type ) {

		let lambdachem = this.cellParameter("LAMBDA_CH", src_type )
		let l1 = lambdachem
		if( this.parameters["retract"]){
			if( src_type == 0 ) lambdachem = this.cellParameter("LAMBDA_CH", tgt_type )
		}
		if( src_type != 0 & tgt_type != 0 ){
			lambdachem = lambdachem * this.parameters["X"]
		}

		if( lambdachem == 0 ) return 0
		let delta = this.concDiff( targeti, sourcei )
		let out = -delta*lambdachem
		/*if( Math.random() < 0.0005 ){
			if( delta > 0 ) console.log( "dc = " + delta + "; lambda = " + l1 + "; dH = " + out)
		} */
		return -delta*lambdachem
	}

}

// more than standard neighborhood options
class CustomGrid extends CPM.Grid2D{
	constructor( extents, torus, defaultorder = 2 ){
		super( extents, torus )
		this.order = defaultorder
	}

	t(i){
		let t = i - 1
		if( this.torus[1] && ( i % this.X_STEP === 0 ) ){
			t += this.extents[1]
		}
		return t
	}
	b(i){
		let b = i + 1
		if( this.torus[1] && ( (i+1-this.extents[1]) % this.X_STEP === 0 ) ){
			b -= this.extents[1]
		}
		return b
	}
	l(i){
		let l = i - this.X_STEP
		if( this.torus[0] && ( i < this.extents[1] ) ) {
			l += ( this.extents[0] * this.X_STEP )
		}
		return l
	}
	r(i){
		let r = i + this.X_STEP
		if( this.torus[0] && (  i >= this.X_STEP*( this.extents[0] - 1 ) ) ) {
			r -= ( this.extents[0] * this.X_STEP )
		}
		return r
	}
	neighi(i,order = this.order ){
		let t = this.t(i), b = this.b(i), r = this.r(i), l = this.l(i)
		if( order == 1 ){
			return[ l,r,t,b]
		}

		let tl = this.l(t), tr = this.r(t), bl = this.l(b), br = this.r(b)
		if( order == 2 ){
			return [tl,l,bl,t,b,tr,r,br]
		}

		let tt = this.t(t), ll = this.l(l), bb = this.b(b), rr = this.r(r)
		if( order == 3 ){
			return [tl,l,bl,t,b,tr,r,br,tt,ll,bb,rr]
		}

		let ttl = this.l(tt), ttr = this.r(tt), llt = this.t(ll), llb = this.b(ll),
			bbl = this.l(bb), bbr = this.r(bb), rrt = this.t(rr), rrb = this.b(rr)
		if( order == 4 ){
			return [tl,l,bl,t,b,tr,r,br,tt,ll,bb,rr, ttl, ttr, llt, llb, bbl, bbr, rrt, rrb ]
		}

		throw( "Orders >4 not implemented!" )
	}
}

// update to use variable order neighborhood
class Adhesion2 extends CPM.Adhesion {


	J( t1, t2 ) {
		return this.cellParameter("J2", t1)[this.C.cellKind(t2)]
	}
	neighi(i){
		return this.C.grid.neighi(i, this.conf.order)
	}
	confChecker(){}

	H( i, tp ){
		let r = 0, tn
		/* eslint-disable */
		const N = this.neighi( i )
		for( let j = 0 ; j < N.length ; j ++ ){
			tn = this.C.pixti( N[j] )
			if( tn != tp ) r += this.J( tn, tp )
		}
		return r
	}
	// same but not scaled by J, just count the surface in number of pixels
	// (used for the perimeter output in unit tests 1 and 2)
	surf( i, tp ) {
		let r = 0, tn
		/* eslint-disable */
		const N = this.neighi( i )
		for( let j = 0 ; j < N.length ; j ++ ){
			tn = this.C.pixti( N[j] )
			if( tn != tp ) r += 1
		}
		return r
	}
}

module.exports = { ChemotaxisConstraintCI, CustomGrid, Adhesion2 }
