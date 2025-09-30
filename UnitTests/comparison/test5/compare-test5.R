library( dplyr, warn.conflicts = FALSE ) 
library( ggplot2 ) 
library( jsonlite )
library( patchwork ) 

mytheme <- theme_bw() + 
theme(
	text = element_text( size = 8 ),
	panel.grid = element_blank(),
	strip.background = element_blank()
)

inJSON <- read_json(  "test5-comparison.json" )

cmap <- setNames( sapply( inJSON$data, function(x) x$color ), sapply( inJSON$data, function(x) x$name ) )

readDF <- function( dataJSON ){
	return( read.csv( dataJSON$file ) %>% mutate( implementation = dataJSON$name ) )
}


dList <- lapply( inJSON$data, readDF )
dall <- bind_rows( dList ) 


pComp <- ggplot( dall, aes( x = time, y = conc, color = implementation ) ) + 
	geom_line() + 
	scale_color_manual( values = cmap ) + 
	scale_y_log10(guide = "axis_logticks") +
	labs( x = "time (MCS)", y = "c(80,80)", color = NULL ) +
	mytheme + theme(
		legend.position = c(1,0),
		legend.justification = c(1,0),
		legend.background = element_blank()
	)

dRef <- setNames( dList[[1]]$conc, dList[[1]]$time ) 
refName <- names(cmap)[1]

dall <- dall %>%
	mutate( delta = conc / dRef[ as.character(time) ]  ) %>%
	mutate( implementation2 = ifelse( implementation == refName, paste0( "REF:", implementation), implementation))

cmap[paste0("REF:",refName )] = cmap[[refName]]

pComp2 <- ggplot( dall, aes( x = time, y = delta, color = implementation2 ) ) + 
	geom_line() + 
	scale_color_manual( values = cmap ) + 
	labs( x = "time (MCS)", y = "c(80,80) (fold-change wrt REF)", color = NULL ) +
	mytheme + theme(
		legend.position = c(1,1),
		legend.justification = c(1,1),
		legend.background = element_blank()
	)
	
p <- pComp + pComp2 + plot_annotation( tag_levels = "A")

ggsave( p, file = "test5-comparison.pdf", width = 15, height = 7, units="cm", useDingbats = FALSE )
