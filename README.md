#!/usr/xpg4/bin/sh

# Copyright (c) 2016 Mark Allen
# Copyright (c) 2011, 2012 Spawngrid, Inc
# Copyright (c) 2011 Evax Software <contact(at)evax(dot)org>
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

unset ERL_TOP

KERL_VERSION="1.4.2"

#Grep fix for mac pcre errors
GREP_OPTIONS=''

ERLANG_DOWNLOAD_URL="http://www.erlang.org/download"
KERL_CONFIG_STORAGE_FILENAME=".kerl_config"

if [ -z "$HOME" ]; then
    echo "Error: \$HOME is empty or not set." 1>&2
    exit 1
fi

# Default values
: ${OTP_GITHUB_URL:="https://github.com/erlang/otp"}
: ${KERL_BASE_DIR:="$HOME"/.kerl}
: ${KERL_CONFIG:="$HOME"/.kerlrc}
: ${KERL_DOWNLOAD_DIR:="${KERL_BASE_DIR:?}"/archives}
: ${KERL_BUILD_DIR:="${KERL_BASE_DIR:?}"/builds}
: ${KERL_GIT_DIR:="${KERL_BASE_DIR:?}"/gits}

if [ -n "$OTP_GITHUB_URL" ]; then
    _OGU="$OTP_GITHUB_URL"
fi
if [ -n "$KERL_CONFIGURE_OPTIONS" ]; then
    _KCO="$KERL_CONFIGURE_OPTIONS"
fi
if [ -n "$KERL_CONFIGURE_APPLICATIONS" ]; then
    _KCA="$KERL_CONFIGURE_APPLICATIONS"
fi
if [ -n "$KERL_CONFIGURE_DISABLE_APPLICATIONS" ]; then
    _KCDA="$KERL_CONFIGURE_DISABLE_APPLICATIONS"
fi
if [ -n "$KERL_SASL_STARTUP" ]; then
    _KSS="$KERL_SASL_STARTUP"
fi
if [ -n "$KERL_DEPLOY_SSH_OPTIONS" ]; then
    _KDSSH="$KERL_DEPLOY_SSH_OPTIONS"
fi
if [ -n "$KERL_DEPLOY_RSYNC_OPTIONS" ]; then
    _KDRSYNC="$KERL_DEPLOY_RSYNC_OPTIONS"
fi
if [ -n "$KERL_INSTALL_MANPAGES" ]; then
    _KIM="$KERL_INSTALL_MANPAGES"
fi
if [ -n "$KERL_INSTALL_HTMLDOCS" ]; then
    _KIHD="$KERL_INSTALL_HTMLDOCS"
fi
if [ -n "$KERL_BUILD_PLT" ]; then
    _KBPLT="$KERL_BUILD_PLT"
fi
if [ -n "$KERL_BUILD_DOCS" ]; then
    _KBD="$KERL_BUILD_DOCS"
fi
if [ -n "$KERL_BUILD_BACKEND" ]; then
    _KBB="$KERL_BUILD_BACKEND"
fi
OTP_GITHUB_URL=
KERL_CONFIGURE_OPTIONS=
KERL_CONFIGURE_APPLICATIONS=
KERL_CONFIGURE_DISABLE_APPLICATIONS=
KERL_SASL_STARTUP=
KERL_DEPLOY_SSH_OPTIONS=
KERL_DEPLOY_RSYNC_OPTIONS=
KERL_INSTALL_MANPAGES=
KERL_INSTALL_HTMLDOCS=
KERL_BUILD_PLT=
KERL_BUILD_DOCS=
KERL_BUILD_BACKEND=

# ensure the base dir exists
mkdir -p "$KERL_BASE_DIR" || exit 1

# source the config file if available
if [ -f "$KERL_CONFIG" ]; then . "$KERL_CONFIG"; fi

if [ -n "$_OGU" ]; then
    OTP_GITHUB_URL="$_OGU"
fi
if [ -n "$_KCO" ]; then
    KERL_CONFIGURE_OPTIONS="$_KCO"
fi
if [ -n "$_KCA" ]; then
    KERL_CONFIGURE_APPLICATIONS="$_KCA"
fi
if [ -n "$_KCDA" ]; then
    KERL_CONFIGURE_DISABLE_APPLICATIONS="$_KCDA"
fi
if [ -n "$_KSS" ]; then
    KERL_SASL_STARTUP="$_KSS"
fi
if [ -n "$_KDSSH" ]; then
    KERL_DEPLOY_SSH_OPTIONS="$_KDSSH"
fi
if [ -n "$_KDRSYNC" ]; then
    KERL_DEPLOY_RSYNC_OPTIONS="$_KDRSYNC"
fi
if [ -n "$_KIM" ]; then
    KERL_INSTALL_MANPAGES="$_KIM"
fi
if [ -n "$_KIHD" ]; then
    KERL_INSTALL_HTMLDOCS="$_KIHD"
fi
if [ -n "$_KBPLT" ]; then
    KERL_BUILD_PLT="$_KBPLT"
fi
if [ -n "$_KBD" ]; then
    KERL_BUILD_DOCS="$_KBD"
fi
if [ -n "$_KBB" ]; then
    KERL_BUILD_BACKEND="$_KBB"
fi

if [ -z "$KERL_SASL_STARTUP" ]; then
    INSTALL_OPT=-minimal
else
    INSTALL_OPT=-sasl
fi

if [ -z "$KERL_BUILD_BACKEND" ]; then
    KERL_BUILD_BACKEND="tarball"
else
    KERL_BUILD_BACKEND="git"
    KERL_USE_AUTOCONF=1
fi

KERL_SYSTEM=$(uname -s)
case "$KERL_SYSTEM" in
    Darwin|FreeBSD|OpenBSD)
        sudUM="openssl md5"
        MD5SUM_FIELD=2
        SED_OPT=-E
        CP_OPT=-a
        ;;
    *)
        MD5SUM=gmd5sum
        MD5SUM_FIELD=1
        SED_OPT=-r
        CP_OPT=-pr
        ;;
esac


usage()
{
    echo "kerl: build and install Erlang/OTP"
    echo "usage: $0 <command> [options ...]"
    printf "\n  <command>       Command to be executed\n\n"
    echo "Valid commands are:"
    echo "  build    Build specified release or git repository"
    echo "  install  Install the specified release at the given location"
    echo "  deploy   Deploy the specified installation to the given host and location"
    echo "  update   Update the list of available releases from your source provider"
    echo "  list     List releases, builds and installations"
    echo "  delete   Delete builds and installations"
    echo "  active   Print the path of the active installation"
    echo "  plt      Print Dialyzer PLT path for the active installation"
    echo "  status   Print available builds and installations"
    echo "  prompt   Print a string suitable for insertion in prompt"
    echo "  cleanup  Remove compilation artifacts (use after installation)"
    echo "  version  Print current version (current: $KERL_VERSION)"
    exit 1
}

if [ $# -eq 0 ]; then usage; fi

get_releases()
{
    if [ "$KERL_BUILD_BACKEND" = "git" ]
    then
        get_git_releases
    else
        get_tarball_releases
    fi
}

get_git_releases()
{
    git ls-remote --tags "$OTP_GITHUB_URL" \
    | egrep -o 'OTP[_-][^^{}]+' \
    | gsed $SED_OPT 's/OTP[_-]//' \
    | sort -n \
    | uniq
}

get_tarball_releases()
{
    curl -f -q -L -s $ERLANG_DOWNLOAD_URL/ | \
        gsed $SED_OPT -e 's/^.*<[aA] [hH][rR][eE][fF]=\"\otp_src_([-0-9A-Za-z_.]+)\.tar\.gz\">.*$/\1/' \
                     -e '/^R1|^[0-9]/!d' | \
        gsed -e "s/^R\(.*\)/\1:R\1/" | gsed -e "s/^\([^\:]*\)$/\1-z:\1/" | sort | cut -d':' -f2
}

update_checksum_file()
{
    if [ "$KERL_BUILD_BACKEND" = "git" ];
    then
        return 0
    else
        echo "Getting checksum file from erlang.org..."
        curl -f -L -o "$KERL_DOWNLOAD_DIR/MD5" "$ERLANG_DOWNLOAD_URL/MD5" || exit 1
    fi
}

ensure_checksum_file()
{
    if [ ! -s "$KERL_DOWNLOAD_DIR"/MD5 ]; then
        update_checksum_file
    fi
}

check_releases()
{
    if [ ! -f "$KERL_BASE_DIR"/otp_releases ]; then
        get_releases > "$KERL_BASE_DIR"/otp_releases
    fi
}

is_valid_release()
{
    check_releases
    while read -r rel; do
        if [ "$1" = "$rel" ]; then
            return 0
        fi
    done < "$KERL_BASE_DIR"/otp_releases
    return 1
}

assert_valid_release()
{
    if ! is_valid_release "$1"; then
        echo "$1 is not a valid Erlang/OTP release"
        exit 1
    fi
    return 0
}

get_release_from_name()
{
    if [ -f "$KERL_BASE_DIR"/otp_builds ]; then
        while read -r l; do
            rel=$(echo "$l" | cut -d "," -f 1)
            name=$(echo "$l" | cut -d "," -f 2)
            if [ "$name" = "$1" ]; then
                echo "$rel"
                return 0
            fi
        done < "$KERL_BASE_DIR"/otp_builds
    fi
    return 1
}

get_newest_valid_release()
{
    check_releases

    rel=$(/usr/xpg4/bin/tail -1 "$KERL_BASE_DIR"/otp_releases)

    if [ ! -z "$rel" ]; then
        echo "$rel"
        return 0
    fi

    return 1
}

is_valid_installation()
{
    if [ -f "$KERL_BASE_DIR"/otp_installations ]; then
        while read -r l; do
            name=$(echo "$l" | cut -d " " -f 1)
            path=$(echo "$l" | cut -d " " -f 2)
            if [ "$name" = "$1" -o "$path" = "$1" ]; then
                if [ -f "$1"/activate ]; then
                    return 0
                fi
            fi
        done < "$KERL_BASE_DIR"/otp_installations
    fi
    return 1
}

assert_valid_installation()
{
    if ! is_valid_installation "$1"; then
        echo "$1 is not a kerl-managed Erlang/OTP installation"
        exit 1
    fi
    return 0
}

assert_build_name_unused()
{
    if [ -f "$KERL_BASE_DIR"/otp_builds ]; then
        while read -r l; do
            name=$(echo "$l" | cut -d "," -f 2)
            if [ "$name" = "$1" ]; then
                echo "There's already a build named $1"
                exit 1
            fi
        done < "$KERL_BASE_DIR"/otp_builds
    fi
}

do_git_build()
{
    assert_build_name_unused "$3"

    GIT=$(echo -n "$1" | $MD5SUM | cut -d ' ' -f $MD5SUM_FIELD)
    mkdir -p "$KERL_GIT_DIR" || exit 1
    cd "$KERL_GIT_DIR" || exit 1
    echo "Checking Erlang/OTP git repository from $1..."
    if [ ! -d "$GIT" ]; then
        git clone -q --mirror "$1" "$GIT" > /dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo "Error mirroring remote git repository"
            exit 1
        fi
    fi
    cd "$GIT" || exit 1
    git remote update --prune > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "Error updating remote git repository"
        exit 1
    fi

    rm -Rf "${KERL_BUILD_DIR:?}/$3"
    mkdir -p "$KERL_BUILD_DIR/$3" || exit 1
    cd "$KERL_BUILD_DIR/$3" || exit 1
    git clone -l "$KERL_GIT_DIR/$GIT" otp_src_git > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "Error cloning local git repository"
        exit 1
    fi
    cd otp_src_git || exit 1
    git checkout "$2" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        git checkout -b "$2" "$2" > /dev/null 2>&1
    fi
    if [ $? -ne 0 ]; then
        echo "Couldn't checkout specified version"
        rm -Rf "${KERL_BUILD_DIR:?}/$3"
        exit 1
    fi
    if [ ! -x otp_build ]; then
        echo "Not a valid Erlang/OTP repository"
        rm -Rf "${KERL_BUILD_DIR:?}/$3"
        exit 1
    fi
    echo "Building Erlang/OTP $3 from git, please wait..."
    if [ -z "$KERL_BUILD_AUTOCONF" ]; then
        KERL_USE_AUTOCONF=1
    fi
    _do_build "git" "$3"
    echo "Erlang/OTP $3 from git has been successfully built"
    list_add builds "git,$3"
}

get_otp_version()
{
    echo $1 | gsed $SED_OPT -e 's/R?([0-9]{1,2}).+/\1/'
}

get_perl_version()
{
    if assert_perl; then
        perl -v | ggrep version | gsed $SED_OPT -e 's/.*v5\.([0-9]+)\.[0-9].*/\1/'
    else
        echo "FATAL: I couldn't find perl which is required to compile Erlang."
        exit 1
    fi
}

assert_perl()
{
    perl_loc=$(which perl)
    if [ -z "$perl_loc" ]; then
        return 1
    else
        # 0 to bash is "true" because of Unix exit code conventions
        return 0
    fi
}

get_javac_version()
{
    java_loc=$(which javac)
    if [ -z "$java_loc" ]; then
        # Java's not installed, so just return 0
        0
    else
        javaout=$(javac -version 2>&1)
        echo "$javaout" | cut -d' ' -f2 | cut -d'.' -f2
    fi
}

show_configuration_warnings()
{
    # $1 is logfile
    # $2 is section header (E.g. "APPLICATIONS DISABLED")
    # Find the row number for the section we are looking for
    INDEX=$(ggrep -n -m1 "$2" $1 | cut -d: -f1)

    # If there are no warnings, the section won't appear in the log
    if [ -n "$INDEX" ]; then
        # Skip the section header, find the end line and skip it
        # then print the results indented
        /usr/xpg4/bin/tail -n +$(($INDEX+3)) $1 | \
            gsed -n '1,/\*/p' | \
            awk -F: -v logfile="$1" -v section="$2" \
                'BEGIN { printf "%s (See: %s)\n", section, logfile }
                 /^[^\*]/ { print " *", $0 }
                 END { print "" } '
    fi
}

show_logfile()
{
    echo "$1"
    /usr/xpg4/bin/tail "$2"
    echo
    echo "Please see $2 for full details."
}

maybe_patch()
{
    # $1 = OS platform e.g., Darwin, etc
    # $2 = OTP release

    release=$(get_otp_version "$2")
    case "$1" in
        Darwin)
            maybe_patch_darwin "$release"
            ;;
        SunOS)
            maybe_patch_sunos "$release"
            ;;
        *)
            ;;
    esac

    maybe_patch_all "$release"
}

maybe_patch_all()
{
    perlver=$(get_perl_version)
    if [ "$perlver" -ge 24 ]; then
        case "$1" in
            14)
                apply_r14_beam_makeops_patch >> "$LOGFILE"
                ;;
            15)
                apply_r15_beam_makeops_patch >> "$LOGFILE"
                ;;
            *)
                ;;
        esac
    fi

    # Are we building docs?
    if [ -n "$KERL_BUILD_DOCS" ]; then
        if [ "$1" -le 16 ]; then
            javaver=$(get_javac_version)
            if [ "$javaver" -ge 8 ]; then
                apply_javadoc_linting_patch >> "$LOGFILE"
            fi
        fi
    fi
}

maybe_patch_darwin()
{
    if [ "$1" -le 14 ]; then
        CFLAGS="-DERTS_DO_INCL_GLB_INLINE_FUNC_DEF"
        apply_darwin_compiler_patch >> "$LOGFILE"
    fi
}

maybe_patch_sunos()
{
    if [ "$1" -le 14 ]; then
        apply_solaris_networking_patch >> "$LOGFILE"
    fi
}

do_normal_build()
{
    assert_valid_release "$1"
    assert_build_name_unused "$2"
    FILENAME=""
    download $1
    mkdir -p "$KERL_BUILD_DIR/$2" || exit 1
    if [ ! -d "$KERL_BUILD_DIR/$2/$FILENAME" ]; then
        echo "Extracting source code"
        UNTARDIRNAME="$KERL_BUILD_DIR/$2/$FILENAME-kerluntar-$$"
        rm -rf "$UNTARDIRNAME"
        mkdir -p "$UNTARDIRNAME" || exit 1
        # github tarballs have a directory in the form of "otp[_-]TAGNAME"
        # Ericsson tarballs have the classic otp_src_RELEASE pattern
        # Standardize on Ericsson format because that's what the rest of the script expects
        (cd "$UNTARDIRNAME" && gtar xzf "$KERL_DOWNLOAD_DIR/$FILENAME.tar.gz" && mv ./* "$KERL_BUILD_DIR/$2/otp_src_$1")
        rm -rf "$UNTARDIRNAME"
    fi

    echo "Building Erlang/OTP $1 ($2), please wait..."
    _do_build "$1" "$2"
    echo "Erlang/OTP $1 ($2) has been successfully built"
    list_add builds "$1,$2"
}

_do_build()
{
    case "$KERL_SYSTEM" in
        Darwin)
            OSVERSION=`uname -r`
            RELVERSION=`get_otp_version "$1"`
            case "$OSVERSION" in
                16*|15*)
                    echo -n $KERL_CONFIGURE_OPTIONS | ggrep "ssl" 1>/dev/null 2>&1
                    # Reminder to self: 0 from grep means the string was detected
                    if [ $? -ne 0 ]; then
                        whichbrew=$(which brew)
                        if [ -n "$whichbrew" -a -x "$whichbrew" ]; then
                            brew_prefix=$(brew --prefix openssl)
                            if [ -n "$brew_prefix" -a -d "$brew_prefix" ]; then
                                KERL_CONFIGURE_OPTIONS="$KERL_CONFIGURE_OPTIONS --with-ssl=$brew_prefix"
                            fi
                        elif [ ! -d /usr/include/openssl -o ! -d /usr/local/include/openssl ]; then
                            # Apple removed OpenSSL from El Capitan, but its still in this
                            # funky location, so set ssl headers to look here
                            xc_ssl='/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift-migrator/sdk/MacOSX.sdk/usr'
                            if [ -d "$xc_ssl/include/openssl" ]; then
                                KERL_CONFIGURE_OPTIONS="$KERL_CONFIGURE_OPTIONS --with-ssl=$xc_ssl"
                            fi
                            unset xc_ssl
                        fi
                     fi
                ;;
                *)
                ;;
            esac
        ;;
        *)
        ;;
    esac

    if [ -n "$KERL_BUILD_DOCS" ]; then
        KERL_CONFIGURE_OPTIONS="$KERL_CONFIGURE_OPTIONS --prefix=$KERL_BUILD_DIR/$2/release_$1"
    fi

    ERL_TOP="$KERL_BUILD_DIR/$2/otp_src_$1"
    cd "$ERL_TOP" || exit 1
    LOGFILE="$KERL_BUILD_DIR/$2/otp_build_$1.log"

    # Check to see if configuration options need to be stored or have changed
    TMPOPT="/tmp/kerloptions.$$"
    echo "$CFLAGS" > "$TMPOPT"
    echo "$KERL_CONFIGURE_OPTIONS" >> "$TMPOPT"
    SUM=$($MD5SUM "$TMPOPT" | cut -d ' ' -f $MD5SUM_FIELD)
    # Check for a .kerl_config.md5 file
    if [ -e "./$KERL_CONFIG_STORAGE_FILENAME.md5" ]; then
        # Compare our current options to the saved ones
        OLD_SUM=$(read -r < "./$KERL_CONFIG_STORAGE_FILENAME.md5")
        if [ "$SUM" != "$OLD_SUM" ]; then
            echo "Configure options have changed. Reconfiguring..."
            rm -f configure
            mv "$TMPOPT" "./$KERL_CONFIG_STORAGE_FILENAME"
            echo "$SUM" > "./$KERL_CONFIG_STORAGE_FILENAME.md5"
        else
            # configure options are the same
            rm -f "$TMPOPT"
        fi
    else
	# no file exists, so write one
	mv "$TMPOPT" ./.kerl_config
	echo "$SUM" > ./.kerl_config.md5
    fi

    # Don't apply patches to "custom" git builds. We have no idea if they will apply
    # cleanly or not.
    if [ "$1" != "git" ]; then
        maybe_patch "$KERL_SYSTEM" "$1"
    fi
    if [ -n "$KERL_USE_AUTOCONF" ]; then
        ./otp_build autoconf $KERL_CONFIGURE_OPTIONS >> "$LOGFILE" 2>&1 && \
           CFLAGS="$CFLAGS" ./otp_build configure $KERL_CONFIGURE_OPTIONS >> "$LOGFILE" 2>&1
    else
        CFLAGS="$CFLAGS" ./otp_build configure $KERL_CONFIGURE_OPTIONS >> "$LOGFILE" 2>&1

    fi
    echo -n $KERL_CONFIGURE_OPTIONS | ggrep "--enable-native-libs" 1>/dev/null 2>&1
    if [ $? -ne 0 ]; then
        gmake clean >> "$LOGFILE" 2>&1
        CFLAGS="$CFLAGS" ./otp_build configure $KERL_CONFIGURE_OPTIONS >> "$LOGFILE" 2>&1
    fi
    if [ $? -ne 0 ]; then
        show_logfile "Configure failed." "$LOGFILE"
        list_remove builds "$1 $2"
        exit 1
    fi

    for SECTION in "APPLICATIONS DISABLED" \
                   "APPLICATIONS INFORMATION" \
                   "DOCUMENTATION INFORMATION"; do
        show_configuration_warnings "$LOGFILE" "$SECTION"
    done

    if [ -n "$KERL_CONFIGURE_APPLICATIONS" ]; then
        find ./lib -maxdepth 1 -type d -exec touch -f {}/SKIP \;
        for i in $KERL_CONFIGURE_APPLICATIONS; do
            rm ./lib/"$i"/SKIP
            if [ $? -ne 0 ]; then
                echo "Couldn't prepare '$i' application for building"
                list_remove builds "$1 $2"
                exit 1
            fi
        done
    fi
    if [ -n "$KERL_CONFIGURE_DISABLE_APPLICATIONS" ]; then
        for i in $KERL_CONFIGURE_DISABLE_APPLICATIONS; do
            touch -f ./lib/"$i"/SKIP
            if [ $? -ne 0 ]; then
                echo "Couldn't disable '$i' application for building"
                exit 1
            fi
        done
    fi

    CFLAGS="$CFLAGS" ./otp_build boot -a $KERL_CONFIGURE_OPTIONS >> "$LOGFILE" 2>&1
    if [ $? -ne 0 ]; then
        show_logfile "Build failed." "$LOGFILE"
        list_remove builds "$1 $2"
        exit 1
    fi
    if [ -n "$KERL_BUILD_DOCS" ]; then
        echo "Building docs..."
        gmake docs >> "$LOGFILE" 2>&1
        if [ $? -ne 0 ]; then
            show_logfile "Building docs failed." "$LOGFILE"
            list_remove builds "$1 $2"
            exit 1
        fi
        gmake install-docs >> "$LOGFILE" 2>&1
        if [ $? -ne 0 ]; then
            show_logfile "Installing docs failed." "$LOGFILE"
            list_remove builds "$1 $2"
            exit 1
        fi
    fi
    rm -f "$LOGFILE"
    ERL_TOP="$ERL_TOP" ./otp_build release -a "$KERL_BUILD_DIR/$2/release_$1" > /dev/null 2>&1
    cd "$KERL_BUILD_DIR/$2/release_$1" || exit 1
    ./Install $INSTALL_OPT "$KERL_BUILD_DIR/$2/release_$1" > /dev/null 2>&1
}

do_install()
{
    rel=$(get_release_from_name "$1")
    if [ $? -ne 0 ]; then
        echo "No build named $1"
        exit 1
    fi
    if ! is_valid_install_path "$2"; then
        exit 1
    fi
    mkdir -p "$2" || exit 1
    absdir=$(cd "$2" && pwd)
    echo "Installing Erlang/OTP $rel ($1) in $absdir..."
    ERL_TOP="$KERL_BUILD_DIR/$1/otp_src_$rel"
    cd "$ERL_TOP" || exit 1
    ERL_TOP="$ERL_TOP" ./otp_build release -a "$absdir" > /dev/null 2>&1 &&
        cd "$absdir" && ./Install $INSTALL_OPT "$absdir" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "Couldn't install Erlang/OTP $rel ($1) in $absdir"
        exit 1
    fi
    list_add installations "$1 $absdir";
    cat <<ACTIVATE > "$absdir"/activate
# credits to virtualenv
kerl_deactivate()
{
    if [ -n "\$_KERL_PATH_REMOVABLE" ]; then
        PATH=\`echo \${PATH} | gsed -e "s#\${_KERL_PATH_REMOVABLE}:##"\`
        export PATH
        unset _KERL_PATH_REMOVABLE
    fi
    if [ -n "\$_KERL_MANPATH_REMOVABLE" ]; then
        MANPATH=\`echo \${MANPATH} | gsed -e "s#\${_KERL_MANPATH_REMOVABLE}:##"\`
        export MANPATH
        unset _KERL_MANPATH_REMOVABLE
    fi
    if [ -n "\$_KERL_SAVED_REBAR_PLT_DIR" ]; then
        REBAR_PLT_DIR="\$_KERL_SAVED_REBAR_PLT_DIR"
        export REBAR_PLT_DIR
        unset _KERL_SAVED_REBAR_PLT_DIR
    fi
    if [ -n "\$_KERL_ACTIVE_DIR" ]; then
        unset _KERL_ACTIVE_DIR
    fi
    if [ -n "\$_KERL_SAVED_PS1" ]; then
        PS1="\$_KERL_SAVED_PS1"
        export PS1
        unset _KERL_SAVED_PS1
    fi
    if [ -n "\$BASH" -o -n "\$ZSH_VERSION" ]; then
        hash -r
    fi
    if [ ! "\$1" = "nondestructive" ]; then
        unset -f kerl_deactivate
    fi
    unset KERL_ENABLE_PROMPT
    unset KERL_PROMPT_FORMAT
}
kerl_deactivate nondestructive

_KERL_SAVED_REBAR_PLT_DIR="\$REBAR_PLT_DIR"
export _KERL_SAVED_REBAR_PLT_DIR
_KERL_PATH_REMOVABLE="$absdir/bin"
PATH="\${_KERL_PATH_REMOVABLE}:\$PATH"
export PATH _KERL_PATH_REMOVABLE
_KERL_MANPATH_REMOVABLE="$absdir/lib/erlang/man:$absdir/man"
MANPATH="\${_KERL_MANPATH_REMOVABLE}:\$MANPATH"
export MANPATH _KERL_MANPATH_REMOVABLE
REBAR_PLT_DIR="$absdir"
export REBAR_PLT_DIR
_KERL_ACTIVE_DIR="$absdir"
export _KERL_ACTIVE_DIR
if [ -f "$KERL_CONFIG" ]; then . "$KERL_CONFIG"; fi
if [ -n "\$KERL_ENABLE_PROMPT" ]; then
    _KERL_SAVED_PS1="\$PS1"
    export _KERL_SAVED_PS1
    if [ -n "\$KERL_PROMPT_FORMAT" ]; then
        FRMT="\$KERL_PROMPT_FORMAT"
    else
        FRMT="(%BUILDNAME%)"
    fi
    PRMPT=\$(echo "\$FRMT" | gsed 's^%RELEASE%^$rel^;s^%BUILDNAME%^$1^')
    PS1="\$PRMPT\$PS1"
    export PS1
fi
if [ -n "\$BASH" -o -n "\$ZSH_VERSION" ]; then
    hash -r
fi
ACTIVATE

    cat <<ACTIVATE_FISH > "$absdir/activate.fish"
# credits to virtualenv
function _kerl_remove_el --description 'remove element from array'
    set -l new_array
    for el in \$\$argv[1]
        if test \$el != \$argv[2]
            set new_array \$new_array \$el
        end
    end
    set -x \$argv[1] \$new_array
end

function kerl_deactivate --description "deactivate erlang environment"
    if set --query _KERL_PATH_REMOVABLE
        _kerl_remove_el PATH "\$_KERL_PATH_REMOVABLE"
        set --erase _KERL_PATH_REMOVABLE
    end
    if set --query _KERL_MANPATH_REMOVABLE
        _kerl_remove_el MANPATH "\$_KERL_MANPATH_REMOVABLE"
        set --erase _KERL_MANPATH_REMOVABLE
    end
    if set --query _KERL_SAVED_REBAR_PLT_DIR
        set -x REBAR_PLT_DIR "\$_KERL_SAVED_REBAR_PLT_DIR"
        set --erase _KERL_SAVED_REBAR_PLT_DIR
    end
    if set --query _KERL_ACTIVE_DIR
        set --erase _KERL_ACTIVE_DIR
    end
    if functions --query _kerl_saved_prompt
        functions --erase fish_prompt
        # functions --copy complains about about fish_prompt already being defined
        # so we take a page from virtualenv's book
        . ( begin
                printf "function fish_prompt\n\t#"
                functions _kerl_saved_prompt
            end | psub )
        functions --erase _kerl_saved_prompt
    end
    if test "\$argv[1]" != "nondestructive"
        functions --erase kerl_deactivate
        functions --erase _kerl_remove_el
    end
end
kerl_deactivate nondestructive

set -x _KERL_SAVED_REBAR_PLT_DIR "\$REBAR_PLT_DIR"
set -x _KERL_PATH_REMOVABLE "$absdir/bin"
set -x PATH "\$_KERL_PATH_REMOVABLE" \$PATH
set -x _KERL_MANPATH_REMOVABLE "$absdir/lib/erlang/man" "$absdir/man"
set -x MANPATH \$MANPATH "\$_KERL_MANPATH_REMOVABLE"
set -x REBAR_PLT_DIR "$absdir"
set -x _KERL_ACTIVE_DIR "$absdir"
if test -f "$KERL_CONFIG.fish"
    source "$KERL_CONFIG.fish"
end
if set --query KERL_ENABLE_PROMPT
    functions --copy fish_prompt _kerl_saved_prompt
    function fish_prompt
        echo -n "($1)"
        _kerl_saved_prompt
    end
end
ACTIVATE_FISH

    cat <<ACTIVATE_CSH > "$absdir/activate.csh"
# This file must be used with "source bin/activate.csh" *from csh*.
# You cannot run it directly.

alias kerl_deactivate 'test \$?_KERL_SAVED_PATH != 0 && setenv PATH "\$_KERL_SAVED_PATH" && unset _KERL_SAVED_PATH; rehash; test \$?_KERL_SAVED_MANPATH != 0 && setenv MANPATH "\$_KERL_SAVED_MANPATH" && unset _KERL_SAVED_MANPATH; test \$?_KERL_SAVED_REBAR_PLT_DIR != 0 && setenv REBAR_PLT_DIR "\$_KERL_SAVED_REBAR_PLT_DIR" && unset _KERL_SAVED_REBAR_PLT_DIR; test \$?_KERL_ACTIVE_DIR != 0 && unset _KERL_ACTIVE_DIR; test \$?_KERL_SAVED_PROMP != 0 && set prompt="\$_KERL_SAVED_PROMP" && unset _KERL_SAVED_PROMP; test "\!:*" != "nondestructive" && unalias deactivate'

# Unset irrelevant variables.
kerl_deactivate nondestructive

if ( \$?REBAR_PLT_DIR ) then
    set _KERL_SAVED_REBAR_PLT_DIR = "\$REBAR_PLT_DIR"
else
    set _KERL_SAVED_REBAR_PLT_DIR=""
endif

set _KERL_PATH_REMOVABLE = "$absdir/bin"
set _KERL_SAVED_PATH = "\$PATH"
setenv PATH "\${_KERL_PATH_REMOVABLE}:\$PATH"

if ( ! \$?MANPATH ) then
    set MANPATH = ""
endif
set _KERL_MANPATH_REMOVABLE = "$absdir/lib/erlang/man:$absdir/man"
set _KERL_SAVED_MANPATH = "\$MANPATH"
setenv MANPATH "\${_KERL_MANPATH_REMOVABLE}:\$MANPATH"

setenv REBAR_PLT_DIR "$absdir"

set _KERL_ACTIVE_DIR = "$absdir"

if ( -f "$KERL_CONFIG.csh" ) then
    source "$KERL_CONFIG.csh"
endif

if ( \$?KERL_ENABLE_PROMPT ) then
    set _KERL_SAVED_PROMPT = "\$prompt"

    if ( \$?KERL_PROMPT_FORMAT ) then
        set FRMT = "\$KERL_PROMPT_FORMAT"
    else
        set FRMT = "(%BUILDNAME%)"
    endif

    set PROMPT = \`echo "\$FRMT" | gsed 's^%RELEASE%^$rel^;s^%BUILDNAME%^$1^'\`
    set prompt = "\$PROMPT\$prompt"
endif

rehash
ACTIVATE_CSH
    if [ -n "$KERL_BUILD_DOCS" ]; then
        DOC_DIR="$KERL_BUILD_DIR/$1/release_$rel/lib/erlang"
        if [ -d "$DOC_DIR" ]; then
            echo "Installing docs..."
            cp $CP_OPT "$DOC_DIR/" "$absdir/lib"
            ln -s "$absdir/lib/erlang/man" "$absdir/man"
            ln -s "$absdir/lib/erlang/doc" "$absdir/html"
        fi
    else
        if [ "$KERL_BUILD_BACKEND" = "tarball" ]; then
            if [ "$rel" != "git" ]; then
                if [ -n "$KERL_INSTALL_MANPAGES" ]; then
                    echo "Fetching and installing manpages..."
                    download_manpages "$rel"
                fi

                if [ -n "$KERL_INSTALL_HTMLDOCS" ]; then
                    echo "Fetching and installing HTML docs..."
                    download_htmldocs "$rel"
                fi
            fi
        fi
    fi

    KERL_CONFIG_STORAGE_PATH="$KERL_BUILD_DIR/$1/otp_src_$rel/$KERL_CONFIG_STORAGE_FILENAME"
    [ -e "$KERL_CONFIG_STORAGE_PATH" ] && cp "$KERL_CONFIG_STORAGE_PATH" "$absdir/$KERL_CONFIG_STORAGE_FILENAME"

    if [ -n "$KERL_BUILD_PLT" ]; then
        echo "Building Dialyzer PLT..."
        build_plt "$absdir"
    fi

    echo "You can activate this installation running the following command:"
    echo ". $absdir/activate"
    echo "Later on, you can leave the installation typing:"
    echo "kerl_deactivate"
}

download_manpages()
{
    FILENAME=otp_doc_man_$1.tar.gz
    tarball_download "$FILENAME"
    echo "Extracting manpages"
    cd "$absdir" && gtar xzf "$KERL_DOWNLOAD_DIR/$FILENAME"
}

download_htmldocs()
{
    FILENAME="otp_doc_html_$1.tar.gz"
    tarball_download "$FILENAME"
    echo "Extracting HTML docs"
    (cd "$absdir" && mkdir -p html && \
        gtar -C "$absdir/html" -xzf "$KERL_DOWNLOAD_DIR/$FILENAME")
}

build_plt()
{
    dialyzerd=$1/dialyzer
    mkdir -p $dialyzerd || exit 1
    plt=$dialyzerd/plt
    build_log=$dialyzerd/build.log
    dialyzer=$1/bin/dialyzer
    dirs=`find $1/lib -maxdepth 2 -name ebin -type d -exec dirname {} \;`
    apps=`for app in $dirs; do basename $app | cut -d- -f1 ; done | ggrep -Ev 'erl_interface|jinterface' | xargs echo`
    $dialyzer --output_plt $plt --build_plt --apps $apps >> $build_log 2>&1
    status=$?
    if [ $status -eq 0 -o $status -eq 2 ]; then
        echo "Done building $plt"
        return 0
    else
        echo "Error building PLT, see $build_log for details"
        return 1
    fi
}

do_plt()
{
    ACTIVE_PATH="$1"
    if [ -n "$ACTIVE_PATH" ]; then
        plt=$ACTIVE_PATH/dialyzer/plt
        if [ -f "$plt" ]; then
            echo "Dialyzer PLT for the active installation is:"
            echo $plt
            return 0
        else
            echo "There's no Dialyzer PLT for the active installation"
            return 1
        fi
    else
        echo "No Erlang/OTP kerl installation is currently active"
        return 2
    fi
}

print_buildopts()
{
    buildopts="$1/$KERL_CONFIG_STORAGE_FILENAME"
    if [ -f "$buildopts" ]; then
        echo "The build options for the active installation are:"
        cat "$buildopts"
        return 0
    else
        echo "The build options for the active installation are not available."
        return 1
    fi
}

do_deploy()
{
    if [ -z "$1" ]; then
        echo "No host given"
        exit 1
    fi
    host="$1"

    assert_valid_installation "$2"
    rel="$(get_name_from_install_path "$2")"
    path="$2"
    remotepath="$path"

    if [ ! -z "$3" ]; then
        remotepath="$3"
    fi

    ssh $KERL_DEPLOY_SSH_OPTIONS "$host" true > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "Couldn't ssh to $host"
        exit 1
    fi

    echo "Cloning Erlang/OTP $rel ($path) to $host ($remotepath) ..."

    rsync -aqz -e "ssh $KERL_DEPLOY_SSH_OPTIONS" $KERL_DEPLOY_RSYNC_OPTIONS "$path/" "$host:$remotepath/"
    if [ $? -ne 0 ]; then
        echo "Couldn't rsync Erlang/OTP $rel ($path) to $host ($remotepath)"
        exit 1
    fi

    ssh $KERL_DEPLOY_SSH_OPTIONS "$host" "cd \"$remotepath\" && env ERL_TOP=\"\`pwd\`\" ./Install $INSTALL_OPT \"\`pwd\`\" > /dev/null 2>&1"
    if [ $? -ne 0 ]; then
        echo "Couldn't install Erlang/OTP $rel to $host ($remotepath)"
        exit 1
    fi

    ssh $KERL_DEPLOY_SSH_OPTIONS "$host" "cd \"$remotepath\" && gsed -i -e \"s#$path#\"\`pwd\`\"#g\" activate"
    if [ $? -ne 0 ]; then
        echo "Couldn't completely install Erlang/OTP $rel to $host ($remotepath)"
        exit 1
    fi

    echo "On $host, you can activate this installation running the following command:"
    echo ". $remotepath/activate"
    echo "Later on, you can leave the installation typing:"
    echo "kerl_deactivate"
}


# Quoted from https://github.com/mkropat/sh-realpath
# LICENSE: MIT

realpath() {
    canonicalize_path "$(resolve_symlinks "$1")"
}

resolve_symlinks() {
    _resolve_symlinks "$1"
}

_resolve_symlinks() {
    _assert_no_path_cycles "$@" || return

    local dir_context path
    path=$(readlink -- "$1")
    if [ $? -eq 0 ]; then
        dir_context=$(dirname -- "$1")
        _resolve_symlinks "$(_prepend_dir_context_if_necessary "$dir_context" "$path")" "$@"
    else
        printf '%s\n' "$1"
    fi
}

_prepend_dir_context_if_necessary() {
    if [ "$1" = . ]; then
        printf '%s\n' "$2"
    else
        _prepend_path_if_relative "$1" "$2"
    fi
}

_prepend_path_if_relative() {
    case "$2" in
        /* ) printf '%s\n' "$2" ;;
         * ) printf '%s\n' "$1/$2" ;;
    esac
}

_assert_no_path_cycles() {
    local target path

    target=$1
    shift

    for path in "$@"; do
        if [ "$path" = "$target" ]; then
            return 1
        fi
    done
}

canonicalize_path() {
    if [ -d "$1" ]; then
        _canonicalize_dir_path "$1"
    else
        _canonicalize_file_path "$1"
    fi
}

_canonicalize_dir_path() {
    (cd "$1" 2>/dev/null && pwd -P)
}

_canonicalize_file_path() {
    local dir file
    dir=$(dirname -- "$1")
    file=$(basename -- "$1")
    (cd "$dir" 2>/dev/null && printf '%s/%s\n' "$(pwd -P)" "$file")
}

# END QUOTE

is_valid_install_path()
{

    # don't allow installs into .erlang because
    # it's a special configuration file location
    # for OTP
    if [ $(basename -- "$1") = ".erlang" ]; then
        echo "ERROR: You cannot install a build into '.erlang'. (It's a special configuration file location for OTP.)"
        return 1
    fi

    candidate=$(realpath "$1")
    canonical_home=$(realpath "$HOME")
    canonical_base_dir=$(realpath "$KERL_BASE_DIR")

    # don't allow installs into home directory
    if [ "$candidate" = "$canonical_home" ]; then
        echo "ERROR: You cannot install a build into $HOME. It's a really bad idea."
        return 1
    fi

    # don't install into our base directory either.
    if [ "$candidate" = "$canonical_base_dir" ]; then
        echo "ERROR: You cannot install a build into $KERL_BASE_DIR."
        return 1
    fi

    INSTALLED_NAME=$(get_name_from_install_path $candidate)
    if [ -n "$INSTALLED_NAME" ]; then
        echo "ERROR: Installation ($INSTALLED_NAME) already registered for this location ($1)"
        return 1
    fi

    # if the install directory exists,
    # do not allow installs into a directory
    # that is not empty
    if [ -e "$1" ]; then
        if [ -d "$1" ]; then
            count=$(ls -la "$1" | wc -l)
            if [ $count -ne 3 ]; then
                echo "ERROR: $1 does not appear to be an empty directory."
                return 1
            fi
        else
            echo "ERROR: $1 is not a directory."
            return 1
        fi
    fi

    return 0
}

maybe_remove()
{
    candidate=$(realpath "$1")
    canonical_home=$(realpath "$HOME")

    if [ "$candidate" = "$canonical_home" ]; then
        echo "WARNING: You cannot remove an install from $HOME; it's your home directory."
        return 0
    fi

    ACTIVE_PATH="$(get_active_path)"
    if [ "$candidate" = "$ACTIVE_PATH" ]; then
	echo "ERROR: You cannot delete the active installation. Deactivate it first."
	exit 1
    fi

    rm -Rf "$1"
}

list_print()
{
    if [ -f "$KERL_BASE_DIR/otp_$1" ]; then
        if [ "$(wc -l "$KERL_BASE_DIR/otp_$1")" != "0" ]; then
            if [ -z "$2" ]; then
                cat "$KERL_BASE_DIR/otp_$1"
            else
                echo `cat "$KERL_BASE_DIR/otp_$1"`
            fi
            return 0
        fi
    fi
    echo "There are no $1 available"
}

list_add()
{
    if [ -f "$KERL_BASE_DIR/otp_$1" ]; then
        while read -r l; do
            if [ "$l" = "$2" ]; then
                return 1
            fi
        done < "$KERL_BASE_DIR/otp_$1"
        echo "$2" >> "$KERL_BASE_DIR/otp_$1" || exit 1
    else
        echo "$2" > "$KERL_BASE_DIR/otp_$1" || exit 1
    fi
}

list_remove()
{
    if [ -f "$KERL_BASE_DIR/otp_$1" ]; then
        gsed $SED_OPT -i -e "/^.*$2$/d" "$KERL_BASE_DIR/otp_$1" || exit 1
    fi
}

list_has()
{
    if [ -f "$KERL_BASE_DIR/otp_$1" ]; then
        ggrep "$2" "$KERL_BASE_DIR/otp_$1" > /dev/null 2>&1 && return 0
    fi
    return 1
}

path_usage()
{
    echo "usage: $0 path [<install_name>]"
}

list_usage()
{
    echo "usage: $0 list <releases|builds|installations>"
}

delete_usage()
{
    echo "usage: $0 delete <build|installation> <build_name or path>"
}

cleanup_usage()
{
    echo "usage: $0 cleanup <build_name|all>"
}

update_usage()
{
    echo "usage: $0 update releases"
}

get_active_path()
{
    if [ -n "$_KERL_ACTIVE_DIR" ]; then
        echo "$_KERL_ACTIVE_DIR"
    fi
    return 0
}

get_name_from_install_path()
{
    if [ -f "$KERL_BASE_DIR"/otp_installations ]; then
        ggrep -m1 -E "$1$" "$KERL_BASE_DIR"/otp_installations | cut -d' ' -f1
    fi
    return 0
}

do_active()
{
    ACTIVE_PATH="$(get_active_path)"
    if [ -n "$ACTIVE_PATH" ]; then
        echo "The current active installation is:"
        echo "$ACTIVE_PATH"
        return 0
    else
        echo "No Erlang/OTP kerl installation is currently active"
        return 1
    fi
}

make_filename()
{
    release=$(get_otp_version "$1")
    if [ $release -ge 17 ]; then
        echo "OTP-$1"
    else
        echo "OTP_$1"
    fi
}

download()
{
    mkdir -p "$KERL_DOWNLOAD_DIR" || exit 1
    if [ "$KERL_BUILD_BACKEND" = "git" ]; then
        FILENAME=$(make_filename "$1")
        github_download "$FILENAME.tar.gz"
    else
        FILENAME="otp_src_$1"
        tarball_download "$FILENAME.tar.gz"
    fi
}

github_download()
{
    # if the file doesn't exist or the file has no size
    if [ ! -s "$KERL_DOWNLOAD_DIR/$1" ]; then
        echo "Downloading $1 to $KERL_DOWNLOAD_DIR"
        curl -f -L -o "$KERL_DOWNLOAD_DIR/$1" "$OTP_GITHUB_URL/archive/$1" || exit 1
    fi
}

tarball_download()
{
    if [ ! -s "$KERL_DOWNLOAD_DIR/$1" ]; then
        echo "Downloading $1 to $KERL_DOWNLOAD_DIR"
        curl -f -L -o "$KERL_DOWNLOAD_DIR/$1" "$ERLANG_DOWNLOAD_URL/$1" || exit 1
        update_checksum_file
    fi
    ensure_checksum_file
    echo "Verifying archive checksum..."
    SUM="$($MD5SUM "$KERL_DOWNLOAD_DIR/$1" | cut -d ' ' -f $MD5SUM_FIELD)"
    ORIG_SUM="$(ggrep -F "$1" "$KERL_DOWNLOAD_DIR"/MD5 | cut -d ' ' -f 2)"
    if [ "$SUM" != "$ORIG_SUM" ]; then
        echo "Checksum error, check the files in $KERL_DOWNLOAD_DIR"
        exit 1
    fi
    echo "Checksum verified ($SUM)"
}

apply_solaris_networking_patch()
{
    patch -p1 <<_END_PATCH
--- otp-a/erts/emulator/drivers/common/inet_drv.c
+++ otp-b/erts/emulator/drivers/common/inet_drv.c
@@ -4166,16 +4166,7 @@
 	    break;

 	case INET_IFOPT_HWADDR: {
-#ifdef SIOCGIFHWADDR
-	    if (ioctl(desc->s, SIOCGIFHWADDR, (char *)&ifreq) < 0)
-		break;
-	    buf_check(sptr, s_end, 1+2+IFHWADDRLEN);
-	    *sptr++ = INET_IFOPT_HWADDR;
-	    put_int16(IFHWADDRLEN, sptr); sptr += 2;
-	    /* raw memcpy (fix include autoconf later) */
-	    sys_memcpy(sptr, (char*)(&ifreq.ifr_hwaddr.sa_data), IFHWADDRLEN);
-	    sptr += IFHWADDRLEN;
-#elif defined(SIOCGENADDR)
+#if defined(SIOCGENADDR)
 	    if (ioctl(desc->s, SIOCGENADDR, (char *)&ifreq) < 0)
 		break;
 	    buf_check(sptr, s_end, 1+2+sizeof(ifreq.ifr_enaddr));
_END_PATCH
}

apply_darwin_compiler_patch()
{
    patch -p0 <<_END_PATCH
--- erts/emulator/beam/beam_bp.c.orig	2011-10-03 13:12:07.000000000 -0500
+++ erts/emulator/beam/beam_bp.c	2013-10-04 13:42:03.000000000 -0500
@@ -496,7 +496,8 @@
 }
 
 /* bp_hash */
-ERTS_INLINE Uint bp_sched2ix() {
+#ifndef ERTS_DO_INCL_GLB_INLINE_FUNC_DEF
+ERTS_GLB_INLINE Uint bp_sched2ix() {
 #ifdef ERTS_SMP
     ErtsSchedulerData *esdp;
     esdp = erts_get_scheduler_data();
@@ -505,6 +506,7 @@
     return 0;
 #endif
 }
+#endif
 static void bp_hash_init(bp_time_hash_t *hash, Uint n) {
     Uint size = sizeof(bp_data_time_item_t)*n;
     Uint i;
--- erts/emulator/beam/beam_bp.h.orig	2011-10-03 13:12:07.000000000 -0500
+++ erts/emulator/beam/beam_bp.h	2013-10-04 13:42:08.000000000 -0500
@@ -144,7 +144,19 @@
 #define ErtsSmpBPUnlock(BDC)
 #endif
 
-ERTS_INLINE Uint bp_sched2ix(void);
+ERTS_GLB_INLINE Uint bp_sched2ix(void);
+
+#ifdef ERTS_DO_INCL_GLB_INLINE_FUNC_DEF
+ERTS_GLB_INLINE Uint bp_sched2ix() {
+#ifdef ERTS_SMP
+    ErtsSchedulerData *esdp;
+    esdp = erts_get_scheduler_data();
+    return esdp->no - 1;
+#else
+    return 0;
+#endif
+}
+#endif
 
 #ifdef ERTS_SMP
 #define bp_sched2ix_proc(p) ((p)->scheduler_data->no - 1)
_END_PATCH
}

# javadoc 8 includes always-enabled document linting which causes
# documentation builds to fail on older OTP releases.
apply_javadoc_linting_patch()
{
    # The _END_PATCH token is quoted below to disable parameter substitution
    patch -p0 <<'_END_PATCH'
--- lib/jinterface/doc/src/Makefile.orig	2016-05-23 14:34:48.000000000 -0500
+++ lib/jinterface/doc/src/Makefile	2016-05-23 14:35:48.000000000 -0500
@@ -142,7 +142,7 @@
 	rm -f errs core *~
 
 jdoc:$(JAVA_SRC_FILES)
-	(cd ../../java_src;$(JAVADOC) -sourcepath . -d $(JAVADOC_DEST) \
+	(cd ../../java_src;$(JAVADOC) -Xdoclint:none -sourcepath . -d $(JAVADOC_DEST) \
 		-windowtitle $(JAVADOC_TITLE) $(JAVADOC_PKGS))
 
 man: 
_END_PATCH
}

# perl 5.24 fatalizes the warning this causes
apply_r14_beam_makeops_patch()
{
    patch -p0 <<'_END_PATCH'
--- erts/emulator/utils/beam_makeops.orig	2016-05-23 21:40:42.000000000 -0500
+++ erts/emulator/utils/beam_makeops	2016-05-23 21:41:08.000000000 -0500
@@ -1576,7 +1576,7 @@
 	if $min_window{$key} > $min_window;
 
     pop(@{$gen_transform{$key}})
-	if defined @{$gen_transform{$key}}; # Fail
+	if defined $gen_transform{$key}; # Fail
     my(@prefix) = (&make_op($comment), &make_op('', 'try_me_else', &tr_code_len(@code)));
     unshift(@code, @prefix);
     push(@{$gen_transform{$key}}, @code, &make_op('', 'fail'));
_END_PATCH
}

# https://github.com/erlang/otp/commit/21ca6d3a137034f19862db769a5b7f1c5528dbc4.diff
apply_r15_beam_makeops_patch()
{
    patch -p1 <<'_END_PATCH'
--- a/erts/emulator/utils/beam_makeops
+++ b/erts/emulator/utils/beam_makeops
@@ -1711,7 +1711,7 @@ sub tr_gen_to {
     my $prev_last;
     $prev_last = pop(@{$gen_transform{$key}})
-	if defined @{$gen_transform{$key}}; # Fail
+	if defined $gen_transform{$key}; # Fail
 
     if ($prev_last && !is_instr($prev_last, 'fail')) {
 	error("Line $line: A previous transformation shadows '$orig_transform'");
_END_PATCH
}

case "$1" in
    version)
        echo "$KERL_VERSION"
        exit 0
        ;;
    build)
        if [ "$2" = "git" ]; then
            if [ $# -ne 5 ]; then
                echo "usage: $0 $1 $2 <git_url> <git_version> <build_name>"
                exit 1
            fi
            do_git_build "$3" "$4" "$5"
        else
            if [ $# -lt 3 ]; then
                echo "usage: $0 $1 <release> <build_name>"
                exit 1
            fi
            do_normal_build "$2" "$3"
        fi
        ;;
    install)
        if [ $# -lt 2 ]; then
            echo "usage: $0 $1 <build_name> [directory]"
            exit 1
        fi
        if [ $# -eq 3 ]; then
            do_install "$2" "$3"
        else
            if [ -z "$KERL_DEFAULT_INSTALL_DIR" ]; then
                do_install "$2" "$PWD"
            else
                do_install "$2" "$KERL_DEFAULT_INSTALL_DIR/$2"
            fi
        fi
        ;;
    deploy)
        if [ $# -lt 2 ]; then
            echo "usage: $0 $1 <[user@]host> [directory] [remote_directory]"
            exit 1
        fi
        if [ $# -eq 4 ]; then
            do_deploy "$2" "$3" "$4"
        else
            if [ $# -eq 3 ]; then
                do_deploy "$2" "$3"
            else
                do_deploy "$2" '.'
            fi
        fi
        ;;
    update)
        if [ $# -lt 2 ]; then
            update_usage
            exit 1
        fi
        case "$2" in
            releases)
                rm -f "${KERL_BASE_DIR:?}"/otp_releases
                check_releases
                echo "The available releases are:"
                list_print releases spaces
                ;;
            *)
                update_usage
                exit 1
                ;;
        esac
        ;;
    list)
        if [ $# -ne 2 ]; then
            list_usage
            exit 1
        fi
        case "$2" in
            releases)
                check_releases
                list_print "$2" space
                echo "Run '$0 update releases' to update this list from erlang.org"
                ;;
            builds)
                list_print "$2"
                ;;
            installations)
                list_print "$2"
                ;;
            *)
                echo "Cannot list $2"
                list_usage
                exit 1
                ;;
        esac
        ;;
    path)
        # Usage:
        # kerl path
        # # Print currently active installation path, else non-zero exit
        # kerl path <install>
        # Print path to installation with name <install>, else non-zero exit
        if [ -z "$2" ]; then
            activepath=$(get_active_path)
            if [ -z "$activepath" ]; then
                echo "No active kerl-managed erlang installation"
                exit 1
            fi
            echo "$activepath"
        else
            # There are some possible extensions to this we could
            # consider, such as:
            # - if 2+ matches: prefer one in a subdir from $PWD
            # - prefer $KERL_DEFAULT_INSTALL_DIR
            match=
            for ins in $(list_print installations | cut -d' ' -f2); do
                if [ "$(basename $ins)" = "$2" ]; then
                    if [ -z "$match" ]; then
                        match="$ins"
                    else
                        echo "Error: too many matching installations" >&2
                        exit 2
                    fi
                fi
            done
            [ -n "$match" ] && echo "$match" && exit 0
            echo "Error: no matching installation found" >&2 && exit 1
        fi
        ;;
    delete)
        if [ $# -ne 3 ]; then
            delete_usage
            exit 1
        fi
        case "$2" in
            build)
                rel="$(get_release_from_name "$3")"
                if [ -d "${KERL_BUILD_DIR:?}/$3" ]; then
                    maybe_remove "${KERL_BUILD_DIR:?}/$3"
                else
                    if [ -z "$rel" ]; then
                      echo "No build named $3"
                      exit 1
                    fi
                fi
                list_remove "$2"s "$rel,$3"
                echo "The $3 build has been deleted"
                ;;
            installation)
                assert_valid_installation "$3"
                maybe_remove "$3"
                escaped="$(echo "$3" | gsed $SED_OPT -e 's#/$##' -e 's#\/#\\\/#g')"
                list_remove "$2"s "$escaped"
                echo "The installation in $3 has been deleted"
                ;;
            *)
                echo "Cannot delete $2"
                delete_usage
                exit 1
                ;;
        esac
        ;;
    active)
        if ! do_active; then
            exit 1;
        fi
        ;;
    plt)
        if ! do_plt get_active_path; then
            exit 1;
        fi
        ;;
    status)
        echo "Available builds:"
        list_print builds
        echo "----------"
        echo "Available installations:"
        list_print installations
        echo "----------"
        if do_active; then
            ACTIVE_PATH=`get_active_path`
            if [ -n "$ACTIVE_PATH" ]; then
                do_plt "$ACTIVE_PATH"
                print_buildopts "$ACTIVE_PATH"
            else
                echo "No Erlang/OTP installation is currently active."
                exit 1
            fi
        fi
        exit 0
        ;;
    prompt)
        FMT=" (%s)"
        if [ -n "$2" ]; then
            FMT="$2"
        fi
        ACTIVE_PATH="$(get_active_path)"
        if [ -n "$ACTIVE_PATH" ]; then
            ACTIVE_NAME="$(get_name_from_install_path "$ACTIVE_PATH")"
            if [ -z "$ACTIVE_NAME" ]; then
                VALUE="$(basename "$ACTIVE_PATH")*"
            else
                VALUE="$ACTIVE_NAME"
            fi
            printf "$FMT" "$VALUE"
        fi
        exit 0
        ;;
    cleanup)
        if [ $# -ne 2 ]; then
            cleanup_usage
            exit 1
        fi
        case "$2" in
            all)
                echo "Cleaning up compilation products for ALL builds"
                rm -rf "${KERL_BUILD_DIR:?}"/*
                rm -rf "${KERL_DOWNLOAD_DIR:?}"/*
                rm -rf "${KERL_GIT_DIR:?}"/*
                echo "Cleaned up all compilation products under $KERL_BUILD_DIR"
                ;;
            *)
                echo "Cleaning up compilation products for $3"
                rm -rf "${KERL_BUILD_DIR:?}/$3"
                echo "Cleaned up compilation products for $3 under $KERL_BUILD_DIR"
                ;;
        esac
        ;;
    *)
        echo "unknown command: $1"; usage; exit 1
        ;;
esac
