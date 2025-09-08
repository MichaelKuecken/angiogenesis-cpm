library( dplyr, warn.conflicts = FALSE ) 
library( ggplot2 ) 
library( patchwork ) 
library( celltrackR  )
library( ggbeeswarm ) 
library( jsonlite )

mytheme <- theme_bw() + 
theme(
	text = element_text( size = 8 ),
	panel.grid = element_blank(),
	strip.background = element_blank()
)

inJSON <- read_json(  "test1-comparison.json" )

cmap <- setNames( sapply( inJSON$data, function(x) x$color ), sapply( inJSON$data, function(x) x$name ) )

readDF <- function( dataJSON ){
	return( read.csv( dataJSON$file ) %>% mutate( implementation = dataJSON$name ) )
}


dList <- lapply( inJSON$data, readDF )
dall <- bind_rows( dList ) 

trackList <- lapply( dList, as.tracks, time.column = 1, id.column = 2, pos.columns = 3:4 )

# Plot raw tracks 
pTracks <- ggplot( dall, aes( x = com_1, y = com_2, group = rep, color = implementation ) ) +
	geom_hline( yintercept = 100, linewidth = .2 ) +
	geom_vline( xintercept = 100, linewidth = .2  ) +
	geom_path( alpha = .3, linewidth = .3, show.legend=FALSE ) + 
	facet_wrap( ~ implementation ) +
	scale_color_manual( values = cmap ) +
	labs( x = "x-coordinate (center of mass)", y = "y-coordinate (center of mass)") +
	mytheme

dsumm <- dall %>%
	group_by( implementation, time ) %>%
	summarise( 
		muX = mean(com_1), 
		muY = mean(com_2 ) , 
		loX = quantile( com_1, 0.025 ), 
		loY = quantile( com_2, 0.025 ),
		hiX = quantile( com_1, 0.975 ),
		hiY = quantile( com_2, 0.975 )  )

pX <- ggplot( dsumm, aes( x = time, color = implementation ) ) + 
	geom_line( aes( y = muX ), show.legend=FALSE ) +
	geom_ribbon( aes( ymin = loX, ymax = hiX ), fill = NA, linetype = 2, linewidth = .2 , show.legend=FALSE) +
	scale_color_manual( values = cmap ) + 
	labs( x = "time (MCS)", y = "x-coordinate" ) +
	mytheme
	

pY <- ggplot( dsumm, aes( x = time, color = implementation ) ) + 
	geom_line( aes( y = muY ) , show.legend=FALSE ) +
	geom_ribbon( aes( ymin = loY, ymax = hiY ), fill = NA, linetype = 2, linewidth = .2 , show.legend=FALSE ) +
	scale_color_manual( values = cmap ) + 
	labs( x = "time (MCS)", y = "y-coordinate" ) +
	mytheme

# Plot area distribution
pArea <- ggplot( dall, aes( x = implementation, y = area, color = implementation ) ) + 
	geom_quasirandom( size = .2, show.legend=FALSE ) +
	scale_color_manual( values = cmap ) +
	labs( x = NULL, y = "area (pixels)" ) +
	mytheme

# Plot inst speed distribution
speedData <- bind_rows( lapply( 1:length(inJSON$data), function(i){
	return(data.frame(
		speed = sapply( subtracks( trackList[[i]], 1 ), speed ),
		implementation = inJSON$data[[i]]$name
	))
}) )


pSpeed <- ggplot( speedData, aes( x = implementation, y = speed, fill = implementation ) ) +
	geom_violin( color = NA, alpha = .4, show.legend=FALSE ) +
	labs( x = NULL, y = "inst. speed (pix/MCS)") +
	scale_fill_manual( values = cmap ) +
	scale_y_log10(guide = "axis_logticks") +
	mytheme

# Plot MSD
msdData <- bind_rows( lapply(1:length(inJSON$data), function(k){
	msd <- aggregate( trackList[[k]], squareDisplacement ) %>% mutate( dt = i * timeStep(trackList[[k]]) , implementation = inJSON$data[[k]]$name  )
	return(msd)
} ))

pMSD <- ggplot( msdData, aes( x = dt, y = value , color = implementation ) ) +
	geom_line() +
	labs( x = expression( Delta*"t (MCS)"), y = expression( "MSD (pix"^2*")"), color = NULL) +
	scale_color_manual( values = cmap ) +
	scale_y_log10(guide = "axis_logticks") +
	mytheme +
	theme( legend.position = c(1,0),legend.justification=c(1,0), legend.background = element_blank())


p <- ( pTracks ) / (pX + pY ) /  (pMSD ) / ( pArea + pSpeed ) + plot_annotation( tag_level = 'A')

N <- length( inJSON$data )

w <- 1 + N * 3.5
h <- 1 + N * 7

ggsave( p, file = "test1-comparison.pdf", width = w, height = h, units="cm", useDingbats = FALSE )
