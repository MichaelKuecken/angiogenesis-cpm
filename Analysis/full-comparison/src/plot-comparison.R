library( dplyr, warn.conflicts = FALSE ) 
library( ggplot2 ) 
library( patchwork ) 
library( cowplot ) 
library( png )
library( raster )

argv <- commandArgs( trailingOnly = TRUE ) 

colormap <- c( "Artistoo" = "#84b8e0", "Morpheus" = "#360568", "CC3D" = "#E4C1F9" )

inFile <- argv[1]
scanparm <- argv[2]
comparisons <- unlist( strsplit( argv[3], " " ))
outFile <- argv[4]

dd <- read.csv( inFile ) %>% filter( is.element( framework, comparisons ) ) 

if( scanparm == "cellcell" ){
	
	dd <- dd %>% filter( Jcc > 0 ) %>% mutate( value = Jcc )
	annotations <- c(1, seq(4, 16, by = 4 ))
	jit <- 0.25
	xlab <- expression( J["cell-cell"] )
	lp <- c(0,0)
	
} else if (scanparm == "chemstrength" ) {

	dd$value <- dd$lchem
	annotations <- seq( 0, 600, by = 150 )
	jit <- 10
	xlab <- expression(mu*" (chemotactic strength parameter)")
	lp <- c(0,1)

} else if ( scanparm == "satstrength" ) {

	dd$value <- ifelse( dd$platform == "Morpheus", dd$lchem, dd$saturation )
	annotations <- seq( 0, .6, by = .15 )
	jit <- 0.01
	xlab <- "saturation coefficient"
	lp <- c(1,1)

} else if (scanparm == "vegfdegr" ){

	dd$value <- dd$epsilon
	annotations <- c( 0.05, seq( 0.15, .6, by = .15 ) )
	jit <- 0.01
	xlab <- expression(epsilon)
	lp <- c(0,1)

} else {
	stop( "choose scanvar = cellcell, chemstrength, satstrength, or vegfdegr.")
}

dsum <- dd %>%
	group_by( framework, platform, value ) %>%
	summarise( N = mean(N, na.rm=TRUE) )
 

ann <- data.frame( value2 = annotations )

p <- ggplot( dd, aes( x = value + jit*( as.numeric( as.factor( framework ) ) -2 ), y = N, color = platform ) ) +
	geom_line( data=dsum, alpha = .5 ) +
	geom_jitter( height = 0, width = jit/2, size = .5 ) +
	geom_vline( data = ann, aes( xintercept= value2 ), linewidth = 0.2, color = "gray", lty =2 )+
	labs( x = xlab ,  y = expression("# regions (">="10 pixels )" ), color = NULL ) +
	scale_color_manual( values = colormap ) +
	scale_x_continuous( breaks = unique(c(0, annotations) )  ) +
	theme_bw() +
	theme(
		panel.grid = element_blank(),
		legend.position = lp,
		legend.justification = lp,
		legend.background = element_blank()
	)

getPNG <- function( fName, color ) {
	pn <- readPNG( fName )
	ndim <- length( dim( pn ) ) 
	if( ndim == 2 ) {
		pn <- array( c(pn,pn,pn), c( dim(pn), 3 ) )
	}
	pn <- change_cols( color, pn )
	im <- raster::as.raster(pn)

	p0 <- ggplot() + theme_bw() + theme( panel.grid = element_blank() )
	pout <- p0 + cowplot::draw_image(im) + coord_fixed( expand = FALSE ) 
	#return( p0 + png::readPNG( fName, native = TRUE ) )
	return( pout )
}


change_cols = function( outcol, theimg) {
    r_b = col2rgb(outcol) / 255
    # binarize first
    bin <- theimg
    for( i in 1:3 ){
    	bin[,,i] = as.numeric( theimg[,,1] & theimg[,,2] & theimg[,,3] )
    }
    theimg <- bin
    for (i in 1:3) {
        theimg[,,i][theimg[,,i] == 0] <- r_b[i]
    }
    return(theimg)
}

print(annotations)

pngList <- lapply( comparisons, function( fri ) {
	di <- dd %>% filter( framework == fri )
	pli <- di$platform[1]
	pngi <- sapply( annotations, function(v){
		fi <- di %>% filter( near( value, v ) )  %>% dplyr::select(file) %>% head(1)
		fi <- gsub( "angiogenesisSync", "angiogenesis-sync", fi$file[1] )
		fi <- gsub( "angiogenesisCC3D", "angiogenesis-CC3D", fi )
		return( paste0( "compare_multipleruns/", fri, "/", scanparm,"_scan/",fi ) )
	})
	return (list( platform = pli, png = pngi ))
})

pngList2 <- lapply( pngList, function(x){
	lapply( x$png, getPNG, colormap[[x$platform]])
})

list1 <- unlist( pngList2, recursive = FALSE ) 


m <- length(pngList2) # number of frameworks (rows to display)
n <- length(pngList2[[1]]) # number of annotation patches to show per framework
# auto generate the "design matrix" for the patchwork layout based on m and n
letters_needed <- LETTERS[1:(m * n)]
top_mat <- matrix( letters_needed, nrow = m, ncol = n, byrow = TRUE ) # m x n grid part
design_mat <- rbind( top_mat, matrix(LETTERS[m * n + 1], nrow = 1, ncol = n))
design <- paste( apply(design_mat, 1, paste0, collapse = ""), collapse = "\n" )
heights <- c(rep(0.2, m), 1)

# final patchwork
out <- wrap_plots( c(list1, list(p)), design = design ) + plot_layout(heights = heights)



ph <- 1 + m * 0.2


ggsave( outFile, width = 9, height = ph * 7.5, units = "cm", useDingbats = FALSE )