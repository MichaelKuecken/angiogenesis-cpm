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
				names = c( "x",  "T", "Jcm", "Jcc", "D", "alpha","epsilon","saturation","lchem", "seed", "time" ) ) %>%
			select( Jcc, lchem, saturation, epsilon, seed )  %>%
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
				names = c( "x", "value", "seed" ) ) %>%
			mutate( value = as.numeric(value))
			
		if( parms$x[1] == "cellcell" ) parms$Jcc <- parms$value 
		else if( parms$x[1] == "chemstrength" ) parms$lchem <-  parms$value 
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





d0 <- read.csv( "test-new.csv" ) %>%
	mutate( 
		file = gsub( "-sync", "Sync", file )
	) 
d1 <- read.csv( "test-old.csv" ) %>%
	mutate( file = gsub( "-sync", "Sync", file ) )
	
d0a <- expandDF( d0, "Artistoo" ) %>%
	filter( minSize == 10 ) %>%
	select( Jcc, seed, framework, N, Nwidth, networkLength, nBranches, anisotropy ) %>%
	mutate( type = "new" )
	
d1a <- expandDF( d1, "Artistoo" ) %>%
	filter( minSize == 10 ) %>%
	select( Jcc, seed, framework, N, Nwidth, networkLength, nBranches, anisotropy ) %>%
	mutate( type = "old" )
	
	
stats <- c("N", "Nwidth", "networkLength",
           "nBranches", "anisotropy")

# join old and new datasets
comp <- d0a %>%
  select(Jcc, seed, framework, all_of(stats)) %>%
  rename_with(~ paste0(.x, "_new"), all_of(stats)) %>%
  inner_join(
    d1a %>%
      select(Jcc, seed, framework, all_of(stats)) %>%
      rename_with(~ paste0(.x, "_old"), all_of(stats)),
    by = c("Jcc", "seed", "framework")
  )


plotdat <- bind_rows(lapply(stats, function(s) {
  tibble(
    stat = s,
    old = comp[[paste0(s, "_old")]],
    new = comp[[paste0(s, "_new")]]
  ) }) )
  
   ggplot(plotdat, aes(x = old, y = new)) +
  geom_point(alpha = 0.7) +
  geom_abline(slope = 1, intercept = 0,
              linetype = "dashed", color = "red") +
  facet_wrap(~ stat, scales = "free") +
  theme_bw() +
  labs(
    x = "old",
    y = "new",
    title = "Comparison of statistics: old vs new"
  )
