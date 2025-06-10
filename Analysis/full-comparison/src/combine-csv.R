library( tidyr )
library( dplyr, warn.conflict = FALSE )
library( readr )

argv <- commandArgs( trailingOnly = TRUE ) 

CC3Dfile <- argv[1]
Morpheusfile <- argv[2]
Artistoofile <- argv[3]
outfile <- argv[4]


expandDF <- function( dataframe, platform ){
	
	if( platform == "CC3D" ){
		parms <- dataframe %>% 
			mutate( fName = file ) %>%
			select( fName ) %>%
			separate_wider_delim( fName, delim = "_", 
				names = c( "x",  "Jcm", "Jcc", "lchem", "saturation", "D", "epsilon", "alpha", "seed"  ) ) %>%
			select( Jcc, lchem, saturation, epsilon )
		
		metrics <- dataframe 
			
		out <- cbind( parms, metrics ) %>% mutate( platform = platform )
		return(out)
		
	} else if ( platform == "Artistoo" ){
	
		parms <- dataframe %>% 
			mutate( fName = file ) %>%
			select( fName ) %>%
			separate_wider_delim( fName, delim = "-", 
				names = c( "x", "T", "Jcm", "Jcc", "D", "alpha","epsilon","saturation","lchem", "seed", "time" ) ) %>%
			select( Jcc, lchem, saturation, epsilon )  %>%
			mutate( across( where(is.character), parse_number )) 
					
		metrics <- dataframe 
			
		out <- cbind( parms, metrics ) %>% mutate( platform = platform )
		return(out)
	
	} else if ( platform == "Morpheus" ){
		
		parms <- dataframe %>% 
			mutate( fName = file ) %>%
			select( fName ) %>%
			mutate( Jcc = 1, saturation = 0.1, lchem = 500, epsilon = 0.3 ) %>%
			separate_wider_delim( fName, delim = "_", 
				names = c( "x", "value", "seed" ) ) 
			
		if( parms$x[1] == "cellcell" ) parms$Jcc <- parms$value
		else if( parms$x[1] == "chemstrength" ) parms$lchem <- parms$value
		else if( parms$x[1] == "satstrength" ) parms$saturation <- parms$value
		else if( parms$x[1] == "vegfdegr" ) parms$epsilon <- parms$value
		else stop( "unknown parameter!" )

		parms <- parms %>%		
			select( Jcc, lchem, saturation, epsilon )
			
		
		metrics <- dataframe 
			
		out <- cbind( parms, metrics ) %>% mutate( platform = platform )
		return(out)
		
	} else {
		stop( "unknown platform!" )
	}
	
}

dCC <- expandDF( read.csv( CC3Dfile ), "CC3D" )
dA <- expandDF( read.csv( Artistoofile ), "Artistoo" )
dM <- expandDF( read.csv( Morpheusfile ), "Morpheus" )


dd <- rbind( dCC, dA, dM ) %>%
	filter( minSize == 10 ) %>%
	select( !minSize ) 

write.csv( dd, file = outfile, quote = FALSE, row.names = FALSE )

