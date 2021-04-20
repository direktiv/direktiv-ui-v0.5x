mkfile_path_main := $(abspath $(lastword $(MAKEFILE_LIST)))
mkfile_dir_main := $(dir $(mkfile_path_main))


# Build the new server on docker
.PHONY: server
server:
	if [ ! -d ${mkfile_dir_main}reactjs-embed ]; then \
		git clone git@github.com:vorteil/reactjs-embed.git; \
	fi	
	docker build . --tag vorteil/direktiv-ui