use std::os::windows::prelude::{OsStringExt, OsStrExt};
use std::{thread,time};
use windows::{Win32::{
    UI::WindowsAndMessaging::*,  
    System::Threading::*,
    UI::Shell,
    System::Console,
    Foundation::HINSTANCE,
}, core::PWSTR,
};
//Win32::System::LibraryLoader::*,
use rusqlite::{Connection, };
//Result


// use timetime::cp949;
// Win32::Foundation::*, Win32::System::Threading::*, 

// #[derive(Debug)]
struct NowState{
    now_running_window_name:String,
    now_running_window_path:String,
    now_date:u128
}


fn get_nowstate() -> Result<NowState,&'static str> {

    let time = time::SystemTime::now()
        .duration_since(time::UNIX_EPOCH)
        .unwrap()
        .as_millis();

    unsafe {
        let p0 = GetForegroundWindow();
        // println!("GetForegroundWindow: {:?}",p0);
        let mut lpstring:[u16;128] = [0; 128]; 
        let lpstring_len = GetWindowTextW(p0, &mut lpstring);
        println!("now_running_window_name 길이 {}",lpstring_len);
        // println!("lpstring: {:?}",lpstring);

        let kk = std::ffi::OsString::from_wide(&lpstring[0..(lpstring_len as usize)]).into_string();
        let now_running_window_name = kk.unwrap();
        // println!("now_running_window: {:?}",lpstring);
        println!("now_running_window_name: {}",now_running_window_name);

        // let s = std::str::from_utf8(&lpstring).expect("invalid utf-8 sequence");
        // println!("lpstring: {}", s);/


        // let _kk = GetWindowModuleFileNameW(p0, &mut lpstring);
        // let _kk = std::ffi::OsString::from_wide(&lpstring).into_string();
        // println!("GetWindowModuleFileNameA: {}",kk.unwrap());

        let mut lpdwprocessid:u32=0;
        GetWindowThreadProcessId(p0,  &mut lpdwprocessid as *mut u32);
        // println!("lpdwprocessid: {}", lpdwprocessid);

        if lpdwprocessid==0{
            println!("pid is zero!");
            return Err("pid is zero!");
        }


        let mut lpexename:[u16;128] = [0; 128]; 
        let mut lpexename_size = lpexename.len() as u32;
        let process_handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION,false, lpdwprocessid).unwrap();
        let lpexename_pwstr = PWSTR::from_raw(&mut lpexename as *mut u16);
        QueryFullProcessImageNameW(process_handle, PROCESS_NAME_FORMAT(0), lpexename_pwstr, &mut lpexename_size as *mut u32);

        let mut lpexename_len:usize = lpexename_size as usize;
        for i in 0..lpexename_size{
            if lpexename[i as usize]==0{
                lpexename_len = i as usize;
                break;
            }
        }

        // println!("QueryFullProcessImageNameW lpexename: {:?}", lpexename);
        let kk = std::ffi::OsString::from_wide(&lpexename[0..lpexename_len]).into_string();
        let now_running_window_path = kk.unwrap();
        println!("now_running_window_path: {}",now_running_window_path);
        // let handle = OpenProcess(0, p0, lpdwprocessid).unwrap();
        // handle



        return Ok(NowState {
            now_running_window_name:now_running_window_name,
            now_running_window_path:now_running_window_path,
            now_date:time,
        })

        // GetModuleFileNameA(p0, &mut lpstring);
        // let sss = std::str::from_utf8(&lpstring).expect("invalid utf-8 sequence");
        // println!("GetModuleFileNameA: {}", sss);
    }
}


fn record(conn:&Connection){
    let nowstate = get_nowstate();
    let nowstate = match nowstate {
        Ok(now)=>now,
        Err(_) => return 
    };
    // println!("nowstate: {:?}",nowstate);

    conn.execute(
        "INSERT INTO history (name, path, time) values (?1, ?2, ?3)",
        (&nowstate.now_running_window_name, &nowstate.now_running_window_path, &(nowstate.now_date as i64)),
    ).unwrap();
}



fn str_to_osstring(s:&str)-> [u16;128]{
    let mut out: [u16; 128] = [0; 128]; //fill with 0's
    let mut os_str = std::ffi::OsStr::new(&s); //convert to OS string format or something
    let mut trayToolTipStepUTF16 = os_str.encode_wide().collect::<Vec<u16>>(); //now actually convert to UTF16 format for the OS
    out[..trayToolTipStepUTF16.len()].copy_from_slice(&trayToolTipStepUTF16); 
    out
}

fn main(){
    // display a backtrace
    // use std::env;
    // env::set_var("RUST_BACKTRACE", "1");

    let conn = Connection::open("history.sqlite").unwrap();

    conn.execute("CREATE TABLE if not exists history (
        time INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL
    );", ()).unwrap();

    let dur_sleep = time::Duration::from_secs(10);



    //https://stackoverflow.com/questions/54047397/how-to-make-a-tray-icon-for-windows-using-the-winapi-crate
    let WM_MYMESSAGE = WM_APP + 100; //prep WM_MYMESSAGE
    let mut nid = Shell::NOTIFYICONDATAW::default();// nsafe{ std::mem::zeroed() };//
    nid.cbSize = std::mem::size_of::<Shell::NOTIFYICONDATAW>() as u32;
    unsafe{nid.hWnd = Console::GetConsoleWindow(); }
    nid.uID = 1001;
    nid.uCallbackMessage = WM_MYMESSAGE;
    unsafe{ nid.hIcon = LoadIconW(HINSTANCE::default(), IDI_APPLICATION).unwrap(); }//icon idk
    nid.szTip = str_to_osstring("abc def gehijk");
    nid.uFlags = Shell::NIF_MESSAGE | Shell::NIF_ICON | Shell::NIF_TIP; 

    unsafe{
        Shell::Shell_NotifyIconW(Shell::NIM_MODIFY,&mut nid as *mut Shell::NOTIFYICONDATAW);
        // NIM_ADD
        // NIM_MODIFY
        // NIM_DELETE
    }
    
    // return ;
    loop{
        record(&conn);
        thread::sleep(dur_sleep);
    }

}