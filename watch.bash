#!/bin/sh

daemon() {
    chsum1=""

    while [[ true ]]
    do
        chsum2=`find src/ -type f -exec md5 {} \;`
        if [[ $chsum1 != $chsum2 ]] ; then           
            make
            chsum1=`find src/ -type f -exec md5 {} \;`
        fi
        sleep 2
        
        chsum4=`find static/templates/ -type f -exec md5 {} \;`
        if [[ $chsum3 != $chsum4 ]] ; then           
            make
            chsum3=`find static/templates/ -type f -exec md5 {} \;`
        fi
        sleep 2
        #chsum6=`find static/css/less/ -type f -exec md5 {} \;`
        #if [[ $chsum5 != $chsum6 ]] ; then           
        #    make
        #    chsum5=`find static/css/less/ -type f -exec md5 {} \;`
        #fi
        #sleep 2

    done

}

daemon $*
